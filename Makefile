DEV  = docker compose -f docker-compose.yml -f docker-compose.dev.yml
PROD = docker compose -f docker-compose.yml -f docker-compose.prod.yml

# ──────────────────────────────────────────────
#  Desarrollo
# ──────────────────────────────────────────────
dev:
	$(DEV) up -d

dev-build:
	$(DEV) up -d --build

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

.PHONY: dev dev-build dev-down dev-reset \
        prod prod-build prod-down \
        ps logs logs-backend logs-db logs-nginx \
        shell-backend shell-db shell-redis \
        migrate migrate-undo seed seed-undo db-reset fresh-start \
        test-bot
