DB_URL = $(shell grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | sed 's/+asyncpg//')

.PHONY: apply reset fresh status

apply:
	DATABASE_URL=$(DB_URL) ./scripts/migrate.sh apply

reset:
	DATABASE_URL=$(DB_URL) ./scripts/migrate.sh reset

fresh:
	DATABASE_URL=$(DB_URL) ./scripts/migrate.sh fresh

status:
	DATABASE_URL=$(DB_URL) ./scripts/migrate.sh status
