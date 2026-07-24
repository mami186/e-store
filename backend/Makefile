DB_URL = postgres://postgres@localhost:5432/estore?sslmode=disable

.PHONY: apply reset fresh status

apply:
	DATABASE_URL=$(DB_URL) ./scripts/migrate.sh apply

reset:
	DATABASE_URL=$(DB_URL) ./scripts/migrate.sh reset

fresh:
	DATABASE_URL=$(DB_URL) ./scripts/migrate.sh fresh

status:
	DATABASE_URL=$(DB_URL) ./scripts/migrate.sh status
