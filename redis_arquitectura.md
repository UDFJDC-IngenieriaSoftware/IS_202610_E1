# Arquitectura de Software: Integración de Redis en MiTurno 🚀

Este documento detalla la justificación técnica, diseño e implementación propuesta para integrar **Redis** en la infraestructura del chatbot **MiTurno**. Redis actúa como el motor central para resolver dos de las necesidades arquitectónicas más críticas en sistemas conversacionales en producción: **Gestión de Estado de Sesión (Caché)** y **Programación de Tareas en Segundo Plano (Cronjobs)**.

---

## 🗺️ Visión General de la Infraestructura

En un entorno escalable y tolerante a fallos, el backend de Node.js debe ser **Stateless (sin estado)**. Redis se convierte en el puente de almacenamiento en memoria de alto rendimiento compartido entre todos los nodos de ejecución:

```text
[Cliente / WhatsApp API]
           │
           ▼
     ┌───────────┐
     │  AWS ALB  │
     └─────┬─────┘
           │
     ┌─────┴─────┐
     │   Nginx   │
     └─────┬─────┘
           ├──────────────────────────┐
           ▼                          ▼
   ┌───────────────┐          ┌───────────────┐
   │ Servidor Node │          │ Servidor Node │  ◄── Desacoplados y Stateless
   └───────┬───────┘          └───────┬───────┘
           │                          │
           └──────────┬───────────────┘
                      ▼
              ┌───────────────┐
              │  Redis Store  │  ◄── Memoria compartida ultrarrápida
              └───────────────┘
```

---

## 📁 1. Gestión de Sesión Conversacional (Caché de Estados)

### ¿Por qué es necesario?
WhatsApp envía mensajes asíncronos mediante peticiones HTTP POST independientes y **sin estado (stateless)** a nuestro webhook. Para que el bot guíe al usuario en un flujo de agendamiento de 4 pasos (Servicio ➡️ Horario ➡️ Nombres ➡️ Confirmación), el servidor debe recordar el estado y los datos ingresados en el paso anterior.

### Ventajas de Redis sobre el almacenamiento en memoria (`Map` de JS):
1.  **Persistencia ante reinicios:** Si el servidor se apaga o se actualiza, los usuarios que estén a mitad de un agendamiento no perderán su conversación.
2.  **Expiración Automática (TTL - Time to Live):** Si un cliente abandona la conversación, la sesión se autodestruye automáticamente en Redis en 15 minutos, liberando memoria.
3.  **Escalabilidad Horizontal:** Si se despliegan múltiples contenedores Node.js detrás de un balanceador de carga, cualquier contenedor puede recuperar la sesión del usuario.

### 📝 Blueprint de Implementación (TypeScript)

```typescript
import { createClient } from "redis";
import { BotState, UserSession } from "./bot.types";

const redisClient = createClient({ url: "redis://localhost:6379" });
redisClient.connect();

// 15 Minutos de expiración (900 segundos)
const SESSION_TTL = 900; 

export async function getOrCreateSession(telefono: string): Promise<UserSession> {
  const sessionRaw = await redisClient.get(`session:${telefono}`);
  
  if (sessionRaw) {
    return JSON.parse(sessionRaw) as UserSession;
  }

  // Inicialización de sesión por defecto si es nueva
  return {
    telefono,
    estadoActual: BotState.INICIO,
    datosTemporales: {}
  };
}

export async function saveSession(telefono: string, session: UserSession): Promise<void> {
  await redisClient.set(
    `session:${telefono}`, 
    JSON.stringify(session), 
    { EX: SESSION_TTL } // Autodestrucción por inactividad
  );
}

export async function clearSession(telefono: string): Promise<void> {
  await redisClient.del(`session:${telefono}`);
}
```

---

## 🕐 2. Colas de Tareas y Cronjobs (BullMQ)

### ¿Por qué es necesario?
Un bot de agendamientos necesita ejecutar tareas diferidas en el tiempo o recurrentes en segundo plano. Hacerlo en la memoria de Node.js mediante variables locales (`setTimeout`) es altamente peligroso porque una caída del servidor destruirá todos los recordatorios futuros.

### Casos de Uso Críticos en la Barbería:
1.  **Recordatorios Automáticos de Citas (Delayed Jobs):** Enviar un WhatsApp automático al cliente 2 horas antes de su cita agendada.
2.  **Liberación de Bloques Huérfanos (Timeouts):** Si un usuario pre-selecciona un horario pero no confirma su cita en 10 minutos, una tarea diferida se despierta para liberar el bloque de `Horarios` (estado `'disponible'`).
3.  **Reportes Diarios de Ventas (Cronjobs Recurrentes):** Cada noche a las 9:00 PM, calcular las ventas de cada barbero y enviar un reporte PDF detallado al administrador por correo o WhatsApp.

### 📝 Blueprint de Implementación con BullMQ (TypeScript)

**`BullMQ`** es la librería de estándar industrial de Node.js que implementa colas distribuidas robustas sobre Redis.

```typescript
import { Queue, Worker, Job } from "bullmq";

const connection = { host: "localhost", port: 6379 };

// 1. Instanciar la cola de recordatorios
export const recordatoriosQueue = new Queue("recordatorios-citas", { connection });

// 2. Función para programar una notificación 2 horas antes del evento
export async function programarRecordatorioCita(citaId: string, fechaHoraCita: Date) {
  const dosHorasEnMs = 2 * 60 * 60 * 1000;
  const fechaRecordatorio = new Date(fechaHoraCita.getTime() - dosHorasEnMs);
  const ahora = new Date();
  
  const delay = fechaRecordatorio.getTime() - ahora.getTime();

  if (delay > 0) {
    await recordatoriosQueue.add(
      "enviar-recordatorio",
      { citaId },
      { delay } // BullMQ guardará el job en estado suspendido en Redis
    );
  }
}

// 3. El Worker que ejecuta las tareas en segundo plano (en paralelo)
const worker = new Worker("recordatorios-citas", async (job: Job) => {
  const { citaId } = job.data;
  
  // Lógica: Consultar DB -> Obtener datos del Cliente y Cita -> Enviar WhatsApp
  console.log(`✉️ Tarea disparada: Enviando recordatorio para la cita ${citaId}...`);
}, { connection });
```

---

## 📊 Comparativa de Arquitectura de Sistemas

Para sustentar formalmente la adopción de Redis en las revisiones del proyecto:

| Criterio | `node-cron` / Memoria Local | Redis + BullMQ (Arquitectura Propuesta) |
| :--- | :--- | :--- |
| **Persistencia** | ❌ **Nula**. Si el servidor se apaga o reinicia, los recordatorios futuros desaparecen. |  **Total**. Los jobs se guardan en el disco duro de Redis y continúan al encenderse el servidor. |
| **Concurrencia Distribuida** | ❌ Si tienes 3 EC2 activas, la tarea se ejecutará **3 veces de forma redundante**. |  Redis garantiza un candado distribuido para que la tarea sea tomada **por un solo Worker a la vez**. |
| **Control de Errores** | ❌ Si la llamada a la API de WhatsApp falla por problemas de red, la tarea muere sin aviso. | 🔄 **Reintentos Automáticos** configurables con retraso exponencial (Backoff strategies). |
| **Expiración de Sesión** | ❌ Requiere lógica manual compleja y timers locales para liberar memoria. |  Mapeado directo nativo mediante la función de auto-expiración **TTL**. |

---

## 🎯 Conclusión

La inclusión de **Redis** transforma la aplicación de un prototipo básico en un **sistema distribuido moderno y robusto**. Garantiza una experiencia de usuario impecable (con conversaciones fluidas y seguras ante caídas de servidor) y un flujo de negocio altamente efectivo mediante notificaciones automáticas y alertas programadas e infalibles.
