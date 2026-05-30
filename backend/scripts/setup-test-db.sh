#!/bin/bash

# Script para setup/teardown de base de datos de testing

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Load environment
export $(cat "$PROJECT_ROOT/.env.test" 2>/dev/null || echo "")

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5433}
POSTGRES_DB=${POSTGRES_DB:-bot_db_test}
POSTGRES_USER=${POSTGRES_USER:-postgres}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres_password}

# Commands
case "${1:-up}" in
  up)
    echo "🚀 Starting test database..."
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.test.yml up -d

    echo "⏳ Waiting for database to be ready..."
    for i in {1..30}; do
      if docker exec miturno_postgres_test pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1; then
        echo "✅ Database is ready!"
        exit 0
      fi
      sleep 1
    done
    echo "❌ Database failed to start"
    exit 1
    ;;

  down)
    echo "🛑 Stopping test database..."
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.test.yml down -v
    echo "✅ Test database stopped and cleaned"
    ;;

  reset)
    echo "🔄 Resetting test database..."
    "$0" down
    sleep 2
    "$0" up
    ;;

  logs)
    echo "📋 Test database logs:"
    cd "$PROJECT_ROOT"
    docker-compose -f docker-compose.test.yml logs -f
    ;;

  *)
    echo "Usage: $0 {up|down|reset|logs}"
    exit 1
    ;;
esac
