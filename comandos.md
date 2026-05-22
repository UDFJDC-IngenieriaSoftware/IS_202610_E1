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

