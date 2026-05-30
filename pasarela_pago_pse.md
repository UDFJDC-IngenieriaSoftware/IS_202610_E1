# Integración de Pasarela de Pagos con PSE para MiTurno 🇨🇴💳

Este documento describe la arquitectura, el flujo de interacción del chatbot y el diseño técnico necesario para integrar **PSE (Pagos Seguros en Línea)** en el sistema de agendamiento **MiTurno**.

---

## 🗺️ 1. Introducción y Selección de Plataformas

Dado que **MiTurno** es un proyecto universitario y un prototipo escalable, la integración debe permitir pruebas sin necesidad de constituir legalmente una empresa (sin Cámara de Comercio ni RUT de persona jurídica). Las mejores opciones disponibles en Colombia para esta fase son:

### 1.1 Wompi (de Bancolombia) - *Recomendado*
* **Ventajas:** Permite registrarse como *Persona Natural* para usar el ambiente de desarrollo (**Sandbox**) de forma inmediata.
* **API Moderna:** Excelente documentación, soporte nativo de firmas criptográficas para webhooks y un simulador interactivo de PSE (a través del ficticio *Banco Unión de Pruebas*) que permite ensayar estados aprobados, rechazados y pendientes al instante.

### 1.2 ePayco
* **Ventajas:** Amplio soporte local en Colombia y registro ágil para cobros rápidos. Cuenta con SDK de Node.js robusto.

---

## 🔄 2. Flujo de Pago en el Chatbot (Paso a Paso)

WhatsApp no permite transacciones bancarias ni el ingreso seguro de credenciales financieras dentro del chat por motivos de seguridad. Por lo tanto, el flujo requiere redirigir al usuario temporalmente a la interfaz segura provista por la pasarela de pagos.

```text
[Cliente / WhatsApp]                              [Backend Node.js]                             [Pasarela (Wompi / PSE)]
        │                                                  │                                               │
        │ 1. Solicita cita                                 │                                               │
        ├─────────────────────────────────────────────────>│                                               │
        │                                                  │ 2. Registra Cita ('pendiente')                │
        │                                                  │    y genera Link de Pago                      │
        │                                                  ├──────────────────────────────────────────────>│
        │                                                  │ <─────────────────────────────────────────────┤
        │ 3. Recibe mensaje de WhatsApp con link:          │    Retorna checkout_url                       │
        │    "Para confirmar, paga aquí: [Link]"           │                                               │
        │<─────────────────────────────────────────────────┤                                               │
        │                                                  │                                               │
        │ 4. Da clic, abre navegador, selecciona banco     │                                               │
        │    y realiza el pago de forma segura por PSE     │                                               │
        ├──────────────────────────────────────────────────┼──────────────────────────────────────────────>│
        │                                                  │                                               │
        │                                                  │ 5. Envía notificación Webhook (POST)          │
        │                                                  │    "Transacción APROBADA"                     │
        │                                                  │<──────────────────────────────────────────────┤
        │                                                  │                                               │
        │                                                  │ 6. Actualiza DB (Cita -> 'confirmada')        │
        │ 7. Mensaje de confirmación:                      │    y (Pago -> 'completado')                   │
        │    "¡Pago recibido! Cita confirmada"             │                                               │
        │<─────────────────────────────────────────────────┤                                               │
```

---

## 🗄️ 3. Modelo de Datos y Estados en la Base de Datos (Sequelize)

Para que el flujo funcione sin perder consistencia, debemos sincronizar los estados en nuestra base de datos relacional:

1. **Creación de la Cita:** Al finalizar el flujo de agendamiento en el chatbot, se inserta el registro en la tabla `citas` con `estado: 'pendiente'`.
2. **Creación del Pago:** Se inserta en la tabla `pagos` un registro con `metodo_pago: 'PSE'`, `estado: 'pendiente'`, y almacenamos el `id_transaccion_pasarela` devuelto por Wompi para poder emparejar la transacción en el futuro.
3. **Liberación de Cupos (Opcional con Redis):** Mediante BullMQ, se puede programar una tarea diferida para borrar la cita y liberar el horario si el pago no es confirmado en un lapso de 10 o 15 minutos.

---

## 💻 4. Blueprints de Código (TypeScript)

### 4.1 Creación del Enlace de Pago (Controlador del Bot)

Este método se encarga de empaquetar la información del cobro, consumir el servicio de la pasarela y retornar el enlace seguro de redirección.

```typescript
import axios from "axios";
import { Cita, Pago } from "../models";

interface WompiWidgetResponse {
  data: {
    id: string;
    redirect_url: string; 
  }
}

export async function generarEnlaceDePago(citaId: string, total: number, telefonoCliente: string): Promise<string> {
  const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY; // Tu llave pública de pruebas
  
  // Wompi recibe el dinero en centavos (ej: $15.000 COP = 1500000)
  const montoEnCentavos = total * 100;
  const referenciaUnica = `miturno-${citaId}-${Date.now()}`;

  try {
    // 1. Creación de la sesión de transacción en el Sandbox
    const response = await axios.post<WompiWidgetResponse>(
      "https://sandbox.wompi.co/v1/merchants/transactions",
      {
        amount_in_cents: montoEnCentavos,
        currency: "COP",
        reference: referenciaUnica,
        customer_email: "cliente_miturno@test.com", // Wompi requiere un correo electrónico
        payment_method: {
          type: "PSE",
        },
        redirect_url: "https://miturno.com/pago-exitoso" // Retorno tras flujo bancario
      },
      {
        headers: { Authorization: `Bearer ${WOMPI_PUBLIC_KEY}` }
      }
    );

    const transactionId = response.data.data.id;

    // 2. Registrar el pago en la base de datos PostgreSQL
    await Pago.create({
      idCita: citaId,
      monto: total,
      metodoPago: "PSE",
      estado: "pendiente",
      transaccionId: transactionId // Llave de conciliación con el webhook
    });

    // 3. Generar URL de checkout redirigible para enviar por el chat
    return `https://checkout.wompi.co/p/?refr=${referenciaUnica}&public-key=${WOMPI_PUBLIC_KEY}`;

  } catch (error) {
    console.error("❌ Error creando transacción en Wompi:", error);
    throw new Error("No se pudo generar el enlace de pago de la cita.");
  }
}
```

### 4.2 Endpoint Seguro de Recepción del Webhook (Express API)

El webhook procesa el resultado del pago de manera asíncrona una vez que el banco del usuario notifica a PSE.

```typescript
import { Request, Response } from "express";
import crypto from "crypto";
import { Pago, Cita } from "../models";
import { enviarMensajeWhatsApp } from "./bot.controller"; 

export async function recibirWebhookWompi(req: Request, res: Response) {
  const WOMPI_EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET; // Llave privada de firma de eventos
  
  try {
    const { event, data, signature } = req.body;

    // 1. VALIDAR SEGURIDAD (Evitar suplantación de pagos)
    const properties = data.transaction;
    const cadenaConcatenada = `${properties.id}${properties.status}${properties.amount_in_cents}${req.body.timestamp}${WOMPI_EVENTS_SECRET}`;
    const hashGenerado = crypto.createHash("sha256").update(cadenaConcatenada).digest("hex");

    if (hashGenerado !== signature.checksum) {
      console.warn("⚠️ Intento de webhook con firma inválida detectado.");
      return res.status(401).json({ error: "Firma inválida. Petición rechazada." });
    }

    // 2. PROCESAR EL RESULTADO DE LA TRANSACCIÓN
    if (event === "transaction.updated") {
      const transactionId = properties.id;
      const status = properties.status; // 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR'

      // Buscar el pago registrado originalmente
      const pagoExistente = await Pago.findOne({ where: { transaccionId: transactionId } });

      if (!pagoExistente) {
        return res.status(404).json({ error: "El pago no existe en la base de datos." });
      }

      const cita = await Cita.findByPk(pagoExistente.idCita);

      if (status === "APPROVED") {
        // A. Actualizar estados a completado y confirmado
        pagoExistente.estado = "completado";
        await pagoExistente.save();

        if (cita) {
          cita.estado = "confirmada";
          await cita.save();

          // B. Mensaje de confirmación asíncrono
          await enviarMensajeWhatsApp(
            cita.telefonoCliente, 
            `✅ ¡Pago Recibido por PSE! Tu cita para el servicio ha sido agendada con éxito. ¡Te esperamos!`
          );
        }
      } else if (status === "DECLINED" || status === "ERROR") {
        pagoExistente.estado = "fallido";
        await pagoExistente.save();

        if (cita) {
          cita.estado = "cancelada";
          await cita.save();

          await enviarMensajeWhatsApp(
            cita.telefonoCliente, 
            `❌ Lo sentimos. El pago de tu cita a través de PSE fue rechazado por tu banco. Agenda nuevamente en tu barbería.`
          );
        }
      }
    }

    // Retornamos 200 OK a Wompi para confirmar recepción
    return res.status(200).send("OK");

  } catch (error) {
    console.error("❌ Error interno procesando Webhook de Wompi:", error);
    return res.status(500).json({ error: "Error de servidor al procesar el evento." });
  }
}
```

---

## 🛠️ 5. Pruebas y Validación (Simulación Local)

Dado que las pasarelas requieren una URL pública con HTTPS para enviar notificaciones automáticas (Webhooks), sigue estos pasos para validar localmente:

1. **Crear un túnel HTTPS temporal:** Ejecuta en tu terminal local:
   ```bash
   ngrok http 3000
   ```
   *Esto generará una URL pública segura como `https://c0e8-186-29-10-14.ngrok-free.app`.*
2. **Configurar el Webhook:** En la consola de Wompi, ve a la sección de desarrolladores e ingresa tu URL de ngrok apuntando al endpoint correspondiente (ej: `https://c0e8-186-29-10-14.ngrok-free.app/api/v1/pagos/webhook`).
3. **Simulador de PSE:** En el formulario de pago del Sandbox de Wompi, selecciona **PSE**, busca el **Banco Unión de Pruebas** (el cual aprueba las peticiones inmediatamente) e introduce cualquier dato ficticio para simular la confirmación asíncrona hacia tu servidor local en tiempo real.
