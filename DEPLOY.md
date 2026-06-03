# Despliegue de MiTurno en AWS EC2 (runbook)

Guía para desplegar / redesplegar el stack de MiTurno (backend + PostgreSQL + Redis +
nginx) en una instancia EC2 usando `docker compose` en modo producción, y exponerlo
con HTTPS mediante un túnel de Cloudflare.

> Es un despliegue **de prueba**. No usa orquestador ni dominio propio; la URL pública
> es efímera. Para algo permanente ver la sección [Mejoras pendientes](#mejoras-pendientes).

---

## 1. Datos de la infraestructura

| Recurso | Valor |
|---|---|
| Instancia EC2 | `i-045b86d89178bb41c` (us-east-1, t3.small, Ubuntu 24.04, disco 30GB gp3, swap 4GB) |
| Key pair AWS | `miturno-ec2-key` → privada en `~/.ssh/miturno-ec2-key.pem` (chmod 400) |
| Security group | `sg-0581b92924bd7316d` (SSH 22 desde tu IP, HTTP 80 abierto) |
| Cuenta AWS | `283504979632`, user `cli-user` |
| Código en el host | `~/miturno` (sincronizado por `rsync`, **no** es un repo git) |

⚠️ **La IP pública cambia cada vez que se reinicia la instancia.** Hay que actualizar
`~/.ssh/config` (Host `miturno`) tras cada arranque.

En el host ya están instalados: Docker, docker compose, cloudflared, make.
La imagen del backend instala Chromium (para whatsapp-web.js); ese layer queda cacheado.

---

## 2. Conexión SSH

Con el alias ya configurado en `~/.ssh/config`:

```bash
ssh miturno
```

Equivalente sin alias:

```bash
ssh -i ~/.ssh/miturno-ec2-key.pem ubuntu@<IP_PUBLICA>
```

Bloque en `~/.ssh/config`:

```
Host miturno
  HostName <IP_PUBLICA>          # actualizar tras cada reinicio
  User ubuntu
  IdentityFile ~/.ssh/miturno-ec2-key.pem
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
```

Si `ssh miturno` da timeout, casi siempre es uno de estos dos:
- La IP cambió → actualizar `HostName` (ver paso 3.2).
- Cambiaste de red → tu IP pública cambió y el SG ya no te deja en el puerto 22
  (hay que actualizar la regla del security group).

---

## 3. Redesplegar desde cero (paso a paso)

### 3.1 Arrancar la instancia

```bash
aws ec2 start-instances --instance-ids i-045b86d89178bb41c --region us-east-1
aws ec2 wait instance-running --instance-ids i-045b86d89178bb41c --region us-east-1
```

### 3.2 Obtener la IP pública nueva y actualizar el SSH config

```bash
aws ec2 describe-instances --instance-ids i-045b86d89178bb41c --region us-east-1 \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text
```

Edita `~/.ssh/config` y pon esa IP en `HostName` del Host `miturno`.

Verifica que SSH responde (puede tardar ~30s tras el arranque):

```bash
ssh miturno "uptime"
```

### 3.3 Sincronizar el código local → host

Desde la **raíz del repo local**:

```bash
rsync -az --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='backend/dist' \
  --exclude='frontend/dist' \
  --exclude='frontend/node_modules' \
  --exclude='*.pem' \
  -e ssh ./ miturno:~/miturno/
```

> `--delete` deja el host idéntico al local. Como `.env.production` viaja en el rsync,
> asegúrate de que tu copia local tenga los valores correctos (ver paso 4).

### 3.4 Construir y levantar el stack

```bash
ssh miturno "cd ~/miturno && make prod-build"
```

Esto construye la imagen del backend y levanta los 4 contenedores:
`mi_turno_backend`, `mi_turno_database`, `mi_turno_redis`, `whatsapp_bot_nginx`.

### 3.5 Migraciones y seed

```bash
ssh miturno "cd ~/miturno && make migrate && make seed"
```

### 3.6 Validar /health

```bash
# Por IP pública
curl -s http://<IP_PUBLICA>/health
# Esperado: {"status":"ok","service":"miturno-api"}
```

### 3.7 Levantar el túnel HTTPS público (para webhooks)

```bash
ssh miturno "cd ~/miturno && pkill cloudflared 2>/dev/null; \
  nohup cloudflared tunnel --url http://localhost:80 > ~/cloudflared.log 2>&1 &"

# Leer la URL asignada (https://<aleatorio>.trycloudflare.com):
ssh miturno "grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' ~/cloudflared.log | head -1"
```

Validar el túnel:

```bash
curl -s https://<aleatorio>.trycloudflare.com/health
```

⚠️ La URL `*.trycloudflare.com` es **efímera**: cambia en cada reinicio de cloudflared
y muere si se cierra el proceso. Sirve para registrar el webhook de Wompi/Meta mientras
esté viva. Wompi valida integridad con el header `X-Event-Checksum`, no depende del TLS.

---

## 4. Configuración de entorno (¡importante!)

El backend lee `backend/.env.production` (vía `env_file`) **más** las variables del bloque
`backend.environment` de `docker-compose.prod.yml`.

Variables imprescindibles para que arranque en producción:

| Variable | Dónde está definida | Por qué |
|---|---|---|
| `DB_HOST=database`, `DB_PORT=5432` | `docker-compose.prod.yml` (backend.environment) | Sin esto el backend cae a `localhost:5432` y `migrate`/`seed` fallan con `ECONNREFUSED`. |
| `POSTGRES_DB/USER/PASSWORD` | `docker-compose.prod.yml` (deben coincidir backend y servicio `database`) | Credenciales de conexión. |
| `JWT_SECRET` | `backend/.env.production` | Sin él, `env.ts` lanza `JWT_SECRET must be configured in production` y el backend crashea → nginx devuelve 502. Generar con `openssl rand -hex 32`. |

Credenciales actuales de la BD de producción:

| Campo | Valor |
|---|---|
| Database | `bot_db_prod` |
| Usuario | `postgres_prod` |
| Password | `password_seguro_produccion_cambiame` (cambiar por una robusta) |

> Si editas algo del `environment` o del `.env.production`, recrea el backend para que
> tome los cambios:
> ```bash
> ssh miturno "cd ~/miturno && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d backend"
> ```

---

## 5. WhatsApp (whatsapp-web.js con QR)

El adaptador se elige en `backend/src/whatsapp.factory.ts`. Actualmente producción usa
**whatsapp-web.js** (cliente local con QR), no la Meta Cloud API.

Para vincular tu número, mira los logs del backend y escanea el QR que aparece:

```bash
ssh miturno "docker logs -f mi_turno_backend"
```

En el teléfono: **WhatsApp → Dispositivos vinculados → Vincular dispositivo**.

El QR se regenera cada ~20s. La sesión queda guardada en el volumen `wwebjs_auth`, así que
sobrevive reinicios del contenedor (no hay que re-escanear salvo que cierres sesión o
borres el volumen).

---

## 6. Conectarse a la base de datos con pgAdmin

El puerto 5432 **no** está publicado al host (solo vive en la red interna de docker).
Te conectas con un **túnel SSH** desde tu máquina.

### Opción A — túnel directo al contenedor (sin cambios)

```bash
ssh -L 5433:$(ssh miturno "docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' mi_turno_database"):5432 miturno
```

Deja la sesión abierta y en pgAdmin registra un server con:
`Host=localhost`, `Port=5433`, `DB=bot_db_prod`, `User=postgres_prod`, `Password=...`.

### Opción B — publicar el puerto solo en localhost del host (estable)

En `docker-compose.prod.yml`, servicio `database`:

```yaml
  database:
    ports:
      - "127.0.0.1:5432:5432"
```

Recrea la BD y usa un túnel fijo:

```bash
ssh -L 5433:localhost:5432 miturno
```

---

## 7. Comandos útiles (en el host, dentro de ~/miturno)

> Todos pueden ejecutarse remotamente con `ssh miturno "cd ~/miturno && <comando>"`.

### Make targets

| Comando | Qué hace |
|---|---|
| `make ps` | Estado de los contenedores |
| `make logs` | Logs de todo el stack (follow) |
| `make logs-backend` | Logs solo del backend |
| `make logs-db` | Logs de PostgreSQL |
| `make logs-nginx` | Logs de nginx |
| `make logs-redis` | Logs de Redis |
| `make prod` | Levanta el stack en prod (sin reconstruir) |
| `make prod-build` | Reconstruye imágenes y levanta |
| `make prod-down` | Detiene y elimina los contenedores |
| `make migrate` | Corre migraciones |
| `make migrate-undo` | Revierte la última migración |
| `make seed` | Corre seeders |
| `make seed-undo` | Revierte seeders |
| `make db-reset` | Resetea la BD (¡borra datos!) |
| `make shell-backend` | Shell dentro del contenedor backend |
| `make shell-db` | Shell dentro del contenedor de Postgres |
| `make shell-redis` | Shell de Redis |
| `make tunnel` | Túnel Cloudflare en primer plano |

### Docker directo

```bash
# Estado y recursos
docker compose ps
docker stats --no-stream

# Recrear solo el backend (tras cambiar env)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d backend

# psql dentro del contenedor
docker exec -it mi_turno_database psql -U postgres_prod -d bot_db_prod

# Ver variables de entorno efectivas del backend
docker exec mi_turno_backend env | sort
```

### Túnel Cloudflare

```bash
# Ver la URL actual
ssh miturno "grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' ~/cloudflared.log | head -1"

# Reiniciar el túnel
ssh miturno "pkill cloudflared; nohup cloudflared tunnel --url http://localhost:80 > ~/cloudflared.log 2>&1 &"
```

---

## 8. Apagar / encender (control de costos)

Con la instancia **stopped** solo pagas el disco (~$2.4/mes). Detenerla:

```bash
aws ec2 stop-instances --instance-ids i-045b86d89178bb41c --region us-east-1
```

Al volver a arrancar, repetir desde el paso [3.1](#31-arrancar-la-instancia)
(IP nueva → SSH config → el resto del stack arranca solo gracias a `restart: always`,
pero el túnel hay que relanzarlo y la IP del SSH config actualizarla).

---

## 9. Troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| `ssh miturno` timeout | IP cambió o cambiaste de red | Actualizar `HostName` / regla del SG |
| nginx **502 Bad Gateway** | El backend crasheó al arrancar | `docker logs mi_turno_backend` — suele ser falta de `JWT_SECRET` |
| `migrate`/`seed`: `ECONNREFUSED 127.0.0.1:5432` | Backend sin `DB_HOST` | Verificar `backend.environment` en el compose y recrear el backend |
| No aparece el QR de WhatsApp | Factory no usa el servicio local, o el contenedor no terminó de arrancar | Ver `whatsapp.factory.ts`; `docker logs -f mi_turno_backend` |
| El túnel no responde | cloudflared murió | Relanzarlo (sección 7) |

---

## Mejoras pendientes

- El contenedor backend corre con `tsx watch` (CMD de dev) aun en producción. Funciona,
  pero conviene un CMD de producción (`node dist/...`) y build real.
- URL pública efímera. Para algo estable se necesita dominio (~$10/año) con Cloudflare
  Named Tunnel o Let's Encrypt (ambos sin costo mensual). ACM+ALB sirve pero el ALB
  cuesta ~$16-22/mes.
- Cambiar las contraseñas por defecto (`POSTGRES_PASSWORD`) antes de cualquier uso real.
