# Guía de Comandos útiles - Docker Compose

Esta guía recopila los comandos más comunes para gestionar el ciclo de vida del proyecto utilizando **Docker Compose**.

---

## 🚀 1. Iniciar y Detener Servicios

### Levantar los servicios en segundo plano (Recomendado)
Inicia todos los contenedores definidos en el archivo `docker-compose.yml` en modo *detached* (segundo plano).
```bash
docker compose up -d
```

### Levantar los servicios en primer plano
Inicia los servicios mostrando la salida de logs directamente en la consola actual.
```bash
docker compose up
```

### Reconstruir las imágenes antes de levantar
Si has modificado el `Dockerfile`, las dependencias en `package.json` o algún archivo del código fuente del backend, usa este comando para reconstruir la imagen antes de iniciar.
```bash
docker compose up -d --build
```

### Detener los servicios
Detiene y elimina los contenedores activos del proyecto, pero conserva los volúmenes de datos (base de datos, caché del bot de WhatsApp, etc.).
```bash
docker compose down
```

### Detener los servicios y eliminar volúmenes (Reinicio total)
> [!WARNING]
> Este comando eliminará todos los datos almacenados en la base de datos de PostgreSQL y la sesión activa de WhatsApp. Úsalo con precaución.
```bash
docker compose down -v
```

### 📦 Gestión de un solo contenedor/servicio específico
No es necesario reiniciar todo el proyecto cuando realizas cambios en un único módulo. Puedes operar de forma individual sobre los servicios (`backend`, `database`, `nginx`, `pgadmin`):

*   **Detener un solo servicio:**
    Detiene temporalmente el contenedor sin eliminarlo de Docker.
    ```bash
    docker compose stop <nombre_servicio>
    # Ejemplo: docker compose stop backend
    ```

*   **Iniciar un servicio detenido:**
    ```bash
    docker compose start <nombre_servicio>
    # Ejemplo: docker compose start backend
    ```

*   **Relanzar / Reiniciar un solo servicio:**
    Hace un stop y un start rápido del contenedor especificado.
    ```bash
    docker compose restart <nombre_servicio>
    # Ejemplo: docker compose restart backend
    ```

*   **Reconstruir y levantar un solo servicio:**
    Útil si realizaste cambios en el código del backend o en su Dockerfile y solo quieres regenerar ese contenedor específico de inmediato, sin afectar la base de datos ni los demás contenedores.
    ```bash
    docker compose up -d --build <nombre_servicio>
    # Ejemplo: docker compose up -d --build backend
    ```

*   **Bajar y eliminar un solo contenedor:**
    Detiene forzosamente y destruye el contenedor de ese servicio.
    ```bash
    docker compose rm -fs <nombre_servicio>
    # Ejemplo: docker compose rm -fs backend
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

