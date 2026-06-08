# Guía de Comandos útiles - Docker Compose

Esta guía recopila los comandos más comunes para gestionar el ciclo de vida del proyecto utilizando **Docker Compose**.

---

## 🚀 1. Iniciar y Detener Servicios por Entorno

El proyecto ahora está modularizado mediante múltiples archivos de Docker Compose para separar limpiamente **Desarrollo** y **Producción**:
*   **Desarrollo:** Combina `docker-compose.yml` (Base) + `docker-compose.dev.yml` (Desarrollo).
*   **Producción:** Combina `docker-compose.yml` (Base) + `docker-compose.prod.yml` (Producción).

---

### 💻 1.1 Entorno de DESARROLLO (Local)

En desarrollo se cargan las variables de `./backend/.env.development`, se montan los volúmenes locales en el contenedor para habilitar el *live-reload* en caliente del backend, se expone la base de datos para conexiones externas directas y se levanta **pgAdmin**.

*   **Levantar desarrollo en segundo plano (Recomendado):**
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    ```
*   **Levantar desarrollo en primer plano (Ver logs en vivo):**
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up
    ```
*   **Reconstruir imágenes de desarrollo antes de levantar:**
    *(Útil si modificaste el Dockerfile o instalaste nuevos paquetes en package.json).*
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
    ```
*   **Detener el entorno de desarrollo:**
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.dev.yml down
    ```
*   **Detener desarrollo y eliminar volúmenes (Reinicio a cero de BD):**
    > [!WARNING]
    > Este comando eliminará todos los datos almacenados en la base de datos de pruebas local de PostgreSQL.
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
    ```

---

### 🌐 1.2 Entorno de PRODUCCIÓN (Servidor)

En producción se cargan las variables de `./backend/.env.production`, no se exponen puertos innecesarios hacia el exterior (el puerto de PostgreSQL queda privado dentro de la red interna de Docker), no se monta código local en caliente (se corre el compilado inmutable de la imagen) y se aplican políticas sólidas de reinicio `always`.

*   **Levantar producción en segundo plano (Recomendado):**
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    ```
*   **Reconstruir imágenes de producción antes de levantar:**
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
    ```
*   **Detener el entorno de producción:**
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.prod.yml down
    ```

> [!IMPORTANT]
> **Cambiaste el contenido de `backend/.env.production`?** Un `up -d backend` normal **NO** recrea el contenedor (Docker Compose mira el archivo compose, no el contenido del `env_file`), así que seguiría con las variables viejas. Fuerza la recreación:
> ```bash
> docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate backend
> ```
> En cambio, si cambiaste **código** del backend, hay que reconstruir la imagen (`make prod-build`): en producción no hay *bind-mount*, el código va horneado en la imagen.

> [!NOTE]
> La zona horaria del stack está fijada en `America/Bogota` (`TZ`/`PGTZ` en los compose + hook `SET TIME ZONE` en `database.ts`). Esto evita el desfase de 5h en los recordatorios de citas (`NOW()` y los casts `::timestamptz` operan en hora local).

---

### 📦 1.3 Gestión de un solo contenedor/servicio específico

Puedes interactuar con un único servicio en particular sin alterar el resto de los componentes activos, combinando los archivos del entorno en el que te encuentres:

*   **Detener un solo servicio (en Desarrollo):**
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.dev.yml stop <nombre_servicio>
    # Ejemplo: docker compose -f docker-compose.yml -f docker-compose.dev.yml stop backend
    ```

*   **Iniciar un servicio detenido (en Desarrollo):**
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.dev.yml start <nombre_servicio>
    ```

*   **Relanzar / Reiniciar un solo servicio (en Desarrollo):**
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.dev.yml restart <nombre_servicio>
    ```

*   **Reconstruir y levantar un solo servicio (en Desarrollo):**
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build <nombre_servicio>
    ```

*   **Bajar y eliminar un contenedor individual (en Desarrollo):**
    ```bash
    docker compose -f docker-compose.yml -f docker-compose.dev.yml rm -fs <nombre_servicio>
    ```

---

## 📊 2. Monitoreo y Diagnóstico

### Ver el estado de los contenedores
Muestra una lista de los contenedores activos, sus puertos mapeados y su estado actual.
```bash
docker compose ps
```

### Ver logs en tiempo real (todos los servicios)
```bash
docker compose logs -f
```

### Ver logs de un servicio específico
Si solo quieres monitorizar los logs del backend o de la base de datos:
```bash
# Logs del backend
docker compose logs -f backend

# Logs de la base de datos
docker compose logs -f database

# Logs del proxy Nginx
docker compose logs -f nginx
```

---

## 🔑 3. Credenciales y Puertos de los Servicios

| Servicio | URL / Host | Puerto Externo | Credenciales / Detalles |
| :--- | :--- | :--- | :--- |
| **Nginx (Proxy)** | `http://localhost` | `80` | Proxy inverso principal (enruta `/api/` → backend y `/` → frontend). |
| **Frontend (Vite dev)** | `http://localhost:5173` | `5173` | Dev server del SPA (solo en desarrollo). |
| **Backend (Node.js)** | `http://localhost:3000` | `3000` | Puerto directo del backend. |
| **PostgreSQL** | `localhost` | `5432` | **DB:** `bot_db` <br> **User:** `postgres` <br> **Password:** `postgres_password` |
| **pgAdmin** | `http://localhost:5050` | `5050` | **Email:** `admin@admin.com` <br> **Password:** `admin` |
| **Redis** | `localhost` | `6379` | Sin contraseña en desarrollo. Almacena las sesiones del bot con clave `session:<telefono>` y TTL de 15 minutos. |

---

## 🔌 4. Acceso y Conexiones Directas

### Conectarse a la Base de Datos PostgreSQL (Terminal)
Puedes ingresar directamente a la consola interactiva de PostgreSQL dentro del contenedor usando `psql`:
```bash
docker exec -it mi_turno_database psql -U postgres -d bot_db
```
*(Dentro de la consola de postgres, puedes usar `\dt` para listar tablas o `\q` para salir).*

### Acceder al terminal del Backend (Node.js)
Si necesitas ejecutar scripts, instalar paquetes de prueba o interactuar directamente con el sistema de archivos del backend:
```bash
docker exec -it mi_turno_backend sh
```

### Conectarse a Redis (Terminal)
Para inspeccionar las sesiones activas del bot guardadas en Redis, abre la consola interactiva `redis-cli` dentro del contenedor:
```bash
docker exec -it mi_turno_redis redis-cli
```

Comandos útiles una vez dentro de `redis-cli`:
```
KEYS session:*              # Listar todas las sesiones activas
GET session:573001234567    # Ver el JSON de una sesión específica
TTL session:573001234567    # Segundos restantes antes de que la sesión expire
DBSIZE                      # Cantidad total de claves almacenadas
MONITOR                     # Stream en vivo de TODOS los comandos (útil para debug)
FLUSHDB                     # Borrar TODAS las claves (¡solo usar en desarrollo!)
exit                        # Salir de la consola
```

> [!TIP]
> También puedes ejecutar un comando puntual sin entrar a la consola interactiva, por ejemplo:
> ```bash
> docker exec -it mi_turno_redis redis-cli KEYS "session:*"
> ```

---

## 🗄️ 5. Migraciones y Seeders (Base de Datos)

El proyecto utiliza **`sequelize-cli`** para gestionar los cambios en la estructura de la base de datos de manera profesional y controlada. Las migraciones se definen en la carpeta `migrations/` y los datos de prueba iniciales (seeders) en la carpeta `seeders/`.

> [!IMPORTANT]
> **Todos los comandos de migración y seed deben ejecutarse siempre dentro del contenedor**, ya sea a través de `make` o de `docker exec` directamente. Correrlos desde el host (`npm run migrate` dentro de `backend/`) puede conectarse a una BD diferente o con variables de entorno incorrectas, dejando el esquema en un estado parcial difícil de recuperar.

---

### 🚀 5.1 Primera vez (arranque desde cero)

El comando recomendado hace todo en secuencia: destruye volúmenes, levanta los contenedores, espera que Postgres esté listo y corre migraciones + seeders.

```bash
make fresh-start
```

Equivalente manual si no usas `make`:
```bash
# 1. Destruir volúmenes y levantar contenedores frescos
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 2. Esperar que Postgres acepte conexiones
until docker exec mi_turno_database pg_isready -U postgres -q; do sleep 1; done

# 3. Migrar y sembrar (desde dentro del contenedor)
docker exec mi_turno_backend npm run migrate
docker exec mi_turno_backend npm run seed
```

---

### 🔄 5.2 Operaciones del día a día

Todos estos comandos requieren que los contenedores estén corriendo (`make dev`).

*   **Ejecutar migraciones pendientes:**
    ```bash
    make migrate
    ```
*   **Revertir la última migración:**
    ```bash
    make migrate-undo
    ```
*   **Sembrar datos de prueba:**
    ```bash
    make seed
    ```
*   **Revertir seeders (vaciar datos de prueba):**
    ```bash
    make seed-undo
    ```
*   **Ciclo rápido al cambiar un seeder (datos intactos el esquema):**
    ```bash
    make seed-undo && make seed
    ```

> [!NOTE]
> Los seeders **no se rastrean**: `make seed` siempre intenta insertar todos los registros desde cero. Si los datos ya existen, fallará con error de clave duplicada. Siempre corre `make seed-undo` antes de volver a sembrar.

---

### 💥 5.3 Reset del esquema (sin destruir volúmenes)

Útil cuando cambiaste migraciones y quieres recrear el esquema sin reiniciar Docker. Corre `drop-tables.ts` desde dentro del contenedor para garantizar la conexión correcta.

> [!CAUTION]
> Borra todas las tablas y datos del esquema público. Úsalo solo en desarrollo.

```bash
make db-reset
```

Equivalente manual:
```bash
docker exec mi_turno_backend npx tsx drop-tables.ts
docker exec mi_turno_backend npm run migrate
docker exec mi_turno_backend npm run seed
```

---

### 🧪 5.4 Pruebas y Validación del Bot en Local (Simulación)

Si deseas probar la máquina de estados conversacional y el flujo de agendamiento de citas paso a paso en consola de manera interactiva sin usar la red celular, corre:

```bash
DB_HOST=localhost NODE_ENV=test npx tsx test-bot.ts
```

---

## 🌍 6. Túnel Público con Cloudflare (Webhooks de WhatsApp)

Para que la API de WhatsApp pueda entregar mensajes a tu entorno local, necesita una URL **pública con HTTPS**. Cloudflare ofrece *Quick Tunnels* que generan una URL temporal apuntando a tu nginx local **sin necesidad de cuenta, login ni dominio propio**.

> [!NOTE]
> `cloudflared` ya está instalado en este equipo (el instalador `cloudflared-linux-amd64.deb` está en la raíz del repo). En una máquina nueva instálalo con:
> ```bash
> sudo dpkg -i cloudflared-linux-amd64.deb
> ```

### 6.1 Levantar el túnel

Con los contenedores corriendo (`make dev`), en una terminal aparte:

```bash
make tunnel
```

Equivalente manual:
```bash
cloudflared tunnel --url http://localhost:80
```

El comando imprime en consola una URL del tipo `https://<aleatorio>.trycloudflare.com`. Esa URL apunta a tu **nginx local** (puerto 80) con HTTPS. Úsala como callback del webhook añadiendo la ruta correspondiente, por ejemplo:

```
https://<aleatorio>.trycloudflare.com/webhook
```

> [!IMPORTANT]
> El Quick Tunnel es **efímero**: la URL cambia cada vez que reinicias el comando y el túnel muere al cerrar la terminal (`Ctrl+C`). Tras cada reinicio debes volver a registrar la nueva URL en la configuración del webhook de WhatsApp.

> [!TIP]
> Si prefieres exponer el backend directamente (saltándote nginx), apunta el túnel al puerto 3000:
> ```bash
> cloudflared tunnel --url http://localhost:3000
> ```

