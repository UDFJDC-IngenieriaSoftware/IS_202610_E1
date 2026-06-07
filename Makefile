DEV  = docker compose -f docker-compose.yml -f docker-compose.dev.yml
PROD = docker compose -f docker-compose.yml -f docker-compose.prod.yml

# Despliegue remoto (EC2). Sobreescribibles: make deploy SSH_HOST=otro
SSH_HOST   ?= miturno
REMOTE_DIR ?= ~/miturno
NGINX_CONTAINER ?= whatsapp_bot_nginx

# ──────────────────────────────────────────────
#  Desarrollo
# ──────────────────────────────────────────────
# Sincroniza node_modules del backend con package.json.
# Evita errores tipo "Cannot find module 'X'" cuando se agrega una dependencia
# nueva y el volumen de node_modules del contenedor quedó desactualizado.
# Corre en un contenedor efímero que comparte el volumen `backend_node_modules`
# con el backend real, así funciona incluso si el backend está caído.
deps:
	@echo "🔄 Sincronizando dependencias del backend (package.json ↔ node_modules)..."
	$(DEV) run --rm --no-deps --entrypoint sh backend -c "npm install --no-audit --no-fund"

dev: deps
	$(DEV) up -d

dev-build:
	$(DEV) build
	@$(MAKE) deps
	$(DEV) up -d

dev-down:
	$(DEV) down

dev-reset:
	$(DEV) down -v

# ──────────────────────────────────────────────
#  Producción
# ──────────────────────────────────────────────
prod:
	$(PROD) up -d

prod-build:
	$(PROD) up -d --build

prod-down:
	$(PROD) down

# ──────────────────────────────────────────────
#  Monitoreo
# ──────────────────────────────────────────────
ps:
	docker compose ps

logs:
	$(DEV) logs -f

logs-backend:
	$(DEV) logs -f backend

logs-db:
	$(DEV) logs -f database

logs-nginx:
	$(DEV) logs -f nginx

logs-redis:
	$(DEV) logs -f redis

# ──────────────────────────────────────────────
#  Acceso a contenedores
# ──────────────────────────────────────────────
shell-backend:
	docker exec -it mi_turno_backend sh

shell-db:
	docker exec mi_turno_database psql -U postgres -d bot_db

shell-redis:
	docker exec -it mi_turno_redis redis-cli

# ──────────────────────────────────────────────────────────────────
#  Migraciones y Seeders (siempre dentro del contenedor)
# ──────────────────────────────────────────────────────────────────
migrate:
	docker exec mi_turno_backend npm run migrate

migrate-undo:
	docker exec mi_turno_backend npm run migrate:undo

seed:
	docker exec mi_turno_backend npm run seed

seed-undo:
	docker exec mi_turno_backend npm run seed:undo

# Limpia el esquema y vuelve a migrar + sembrar (contenedores ya corriendo)
db-reset:
	docker exec mi_turno_backend npx tsx drop-tables.ts
	docker exec mi_turno_backend npm run migrate
	docker exec mi_turno_backend npm run seed

# Destruye volúmenes, levanta todo desde cero y corre migraciones + seeders
fresh-start:
	$(DEV) down -v
	@$(MAKE) deps
	$(DEV) up -d
	@echo "Esperando que la base de datos esté lista..."
	@until docker exec mi_turno_database pg_isready -U postgres -q; do sleep 1; done
	docker exec mi_turno_backend npm run migrate
	docker exec mi_turno_backend npm run seed

# ──────────────────────────────────────────────────────────────────
#  Test del bot en consola
# ──────────────────────────────────────────────────────────────────
test-bot:
	cd backend && DB_HOST=localhost NODE_ENV=test npx tsx test-bot.ts

# ──────────────────────────────────────────────────────────────────
#  Túnel público (Cloudflare Quick Tunnel)
#  Expone el nginx local (puerto 80) con una URL HTTPS pública.
#  Útil para recibir webhooks de WhatsApp en desarrollo.
# ──────────────────────────────────────────────────────────────────
tunnel:
	cloudflared tunnel --url http://localhost:80

# ──────────────────────────────────────────────────────────────────
#  Despliegue al EC2 (desde tu máquina local)
#  Prerrequisitos: la instancia encendida y el Host "$(SSH_HOST)" en
#  ~/.ssh/config apuntando a su IP pública actual (ver .local-docs/DEPLOY.md).
#  Las migraciones corren solas al arrancar el backend (docker-entrypoint.sh).
# ──────────────────────────────────────────────────────────────────
deploy: deploy-check deploy-sync deploy-build deploy-restart-nginx
	@echo "✅ Despliegue completado en $(SSH_HOST)."
	@echo "   Verifica:  curl -s http://<IP>/api/   (404 del backend = vivo)"

# Falla temprano y claro si no hay conexión SSH al host.
deploy-check:
	@echo "🔌 Verificando conexión SSH a $(SSH_HOST)..."
	@ssh -o ConnectTimeout=10 $(SSH_HOST) "uptime" >/dev/null 2>&1 || \
		{ echo "❌ No hay conexión SSH a '$(SSH_HOST)'. ¿Instancia encendida y la IP del ~/.ssh/config actualizada? (ver DEPLOY.md)"; exit 1; }

# Sincroniza el código local → host (igual que el runbook).
deploy-sync:
	@echo "📦 Sincronizando código → $(SSH_HOST):$(REMOTE_DIR) ..."
	rsync -az --delete \
		--exclude='.git' \
		--exclude='node_modules' \
		--exclude='backend/dist' \
		--exclude='frontend/dist' \
		--exclude='frontend/node_modules' \
		--exclude='*.pem' \
		-e ssh ./ $(SSH_HOST):$(REMOTE_DIR)/

# Reconstruye imágenes y levanta el stack en el host.
deploy-build:
	@echo "🛠️  Construyendo y levantando el stack en $(SSH_HOST) ..."
	ssh $(SSH_HOST) "cd $(REMOTE_DIR) && make prod-build"

# Reinicia nginx para evitar el 502 tras recrear backend/frontend.
deploy-restart-nginx:
	@echo "🔄 Reiniciando nginx ($(NGINX_CONTAINER)) ..."
	ssh $(SSH_HOST) "docker restart $(NGINX_CONTAINER)"

# Logs del backend remoto (follow), p.ej. para escanear el QR de WhatsApp.
deploy-logs:
	ssh $(SSH_HOST) "docker logs -f mi_turno_backend"

.PHONY: deps dev dev-build dev-down dev-reset \
        prod prod-build prod-down \
        ps logs logs-backend logs-db logs-nginx \
        shell-backend shell-db shell-redis \
        migrate migrate-undo seed seed-undo db-reset fresh-start \
        test-bot tunnel \
        deploy deploy-check deploy-sync deploy-build deploy-restart-nginx deploy-logs
