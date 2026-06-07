#!/bin/sh
# Entrypoint del backend: aplica migraciones pendientes antes de arrancar la app.
# Se usa tanto en desarrollo (CMD: npm run dev) como en producción, ya que
# ejecuta las migraciones y luego delega en el comando recibido (exec "$@").
set -e

MAX_RETRIES=30
RETRY_DELAY=2

echo "[entrypoint] Aplicando migraciones de base de datos..."

n=0
until npm run migrate; do
  n=$((n + 1))
  if [ "$n" -ge "$MAX_RETRIES" ]; then
    echo "[entrypoint] ❌ No se pudieron aplicar las migraciones tras $n intentos. Abortando."
    exit 1
  fi
  echo "[entrypoint] ⏳ BD no lista o migración falló. Reintento $n/$MAX_RETRIES en ${RETRY_DELAY}s..."
  sleep "$RETRY_DELAY"
done

echo "[entrypoint] ✅ Migraciones al día. Iniciando aplicación: $*"
exec "$@"
