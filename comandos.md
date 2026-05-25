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
| **Nginx (Proxy)** | `http://localhost` | `80` | Proxy inverso principal. |
| **Backend (Node.js)** | `http://localhost:3000` | `3000` | Puerto directo del backend. |
| **PostgreSQL** | `localhost` | `5432` | **DB:** `bot_db` <br> **User:** `postgres` <br> **Password:** `postgres_password` |
| **pgAdmin** | `http://localhost:5050` | `5050` | **Email:** `admin@admin.com` <br> **Password:** `admin` |
| **Redis** | `localhost` | `6379` | Sin contraseña en desarrollo. Almacena las sesiones del bot con clave `session:<telefono>` y TTL de 15 minutos. |

---

## 🔌 4. Acceso y Conexiones Directas

### Conectarse a la Base de Datos PostgreSQL (Terminal)
Puedes ingresar directamente a la consola interactiva de PostgreSQL dentro del contenedor usando `psql`:
```bash
docker exec -it whatsapp_bot_database psql -U postgres -d bot_db
```
*(Dentro de la consola de postgres, puedes usar `\dt` para listar tablas o `\q` para salir).*

### Acceder al terminal del Backend (Node.js)
Si necesitas ejecutar scripts, instalar paquetes de prueba o interactuar directamente con el sistema de archivos del backend:
```bash
docker exec -it whatsapp_bot_backend sh
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

---

### 💻 5.1 Ejecución desde la máquina principal (Host)

Puedes ejecutar los comandos directamente desde tu terminal local (dentro de la carpeta `backend`), gracias a que el entorno de desarrollo expone el puerto `5432` hacia el exterior.

*   **Limpiar por completo la base de datos (Reset a cero):**
    > [!CAUTION]
    > Esto borrará de forma definitiva todas las tablas y datos del esquema público en Postgres. Úsalo solo en desarrollo.
    ```bash
    npx tsx drop-tables.ts
    ```
*   **Ejecutar todas las migraciones pendientes (Creación de Tablas):**
    ```bash
    npm run migrate
    ```
*   **Revertir la última migración aplicada (Deshacer cambios):**
    ```bash
    npm run migrate:undo
    ```
*   **Poblar la base de datos con datos de prueba (Seeders de Barberos, Servicios y Horarios):**
    ```bash
    npm run seed
    ```
*   **Revertir todos los datos sembrados (Vaciar semillas):**
    ```bash
    npm run seed:undo
    ```
*   **Ciclo de recreación completa de desarrollo (Recomendado al cambiar el esquema):**
    ```bash
    npx tsx drop-tables.ts && npm run migrate && npm run seed
    ```

---

### 🐳 5.2 Ejecución dentro del contenedor de Docker

Si estás desplegando o no tienes Node.js/tsx instalado localmente en el host, puedes inyectar los comandos directamente dentro del contenedor del backend corriendo:

*   **Correr migraciones dentro de Docker:**
    ```bash
    docker exec -it mi_turno_backend npm run migrate
    ```
*   **Correr seeders dentro de Docker:**
    ```bash
    docker exec -it mi_turno_backend npm run seed
    ```
*   **Deshacer la última migración dentro de Docker:**
    ```bash
    docker exec -it mi_turno_backend npm run migrate:undo
    ```

---

### 🧪 5.3 Pruebas y Validación del Bot en Local (Simulación)

Si deseas probar la máquina de estados conversacional y el flujo de agendamiento de citas paso a paso en consola de manera interactiva sin usar la red celular, corre:

```bash
DB_HOST=localhost NODE_ENV=test npx tsx test-bot.ts
```

