#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BIN_DIR="$PROJECT_DIR/bin"
ATLAS_BIN="$BIN_DIR/atlas"
ATLAS_VERSION="v0.32.0"

DB_URL="${DATABASE_URL:-postgres://postgres@localhost:5432/estore?sslmode=disable}"
DEV_DB_NAME="atlas_dev"
DEV_DB_URL="postgres://postgres@localhost:5432/${DEV_DB_NAME}?sslmode=disable"

MIGRATIONS_DIR="file://$PROJECT_DIR/migrations"

# Detect OS/arch for downloading the correct Atlas binary
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64) ARCH="amd64" ;;
  aarch64|arm64) ARCH="arm64" ;;
esac

download_atlas() {
  echo "Downloading Atlas $ATLAS_VERSION for $OS/$ARCH..."
  mkdir -p "$BIN_DIR"
  URL="https://release.ariga.io/atlas/atlas-${OS}-${ARCH}-${ATLAS_VERSION}"
  if command -v curl &>/dev/null; then
    curl -fsSL "$URL" -o "$ATLAS_BIN"
  elif command -v wget &>/dev/null; then
    wget -q "$URL" -O "$ATLAS_BIN"
  else
    echo "Error: curl or wget required to download Atlas" >&2
    exit 1
  fi
  chmod +x "$ATLAS_BIN"
  echo "Atlas downloaded to $ATLAS_BIN"
}

ensure_atlas() {
  if [ ! -f "$ATLAS_BIN" ]; then
    download_atlas
  fi
}

ensure_dev_db() {
  if command -v createdb &>/dev/null; then
    createdb "$DEV_DB_NAME" 2>/dev/null || true
  fi
}

drop_dev_db() {
  if command -v dropdb &>/dev/null; then
    dropdb "$DEV_DB_NAME" 2>/dev/null || true
  fi
}

case "${1:-help}" in
  init)
    ensure_atlas
    ensure_dev_db
    echo "Inspecting current database schema..."
    "$ATLAS_BIN" schema inspect -u "$DB_URL" --format '{{ sql . }}' > "$PROJECT_DIR/schema.sql"
    echo "Schema dumped to schema.sql"
    echo "Generating initial migration..."
    drop_dev_db
    ensure_dev_db
    "$ATLAS_BIN" migrate diff initial \
      --dir "$MIGRATIONS_DIR" \
      --dev-url "$DEV_DB_URL" \
      --to "file://$PROJECT_DIR/schema.sql"
    echo "Initial migration generated in migrations/"
    ;;

  diff)
    if [ -z "${2:-}" ]; then
      echo "Usage: $0 diff <name>" >&2
      exit 1
    fi
    ensure_atlas
    ensure_dev_db
    "$ATLAS_BIN" schema inspect -u "$DB_URL" --format '{{ sql . }}' > "$PROJECT_DIR/schema.sql"
    echo "Schema updated in schema.sql"
    drop_dev_db
    ensure_dev_db
    "$ATLAS_BIN" migrate diff "$2" \
      --dir "$MIGRATIONS_DIR" \
      --dev-url "$DEV_DB_URL" \
      --to "file://$PROJECT_DIR/schema.sql"
    ;;

  apply)
    ensure_atlas
    HAS_ATLAS_TABLE=$(psql "$DB_URL" -Atq -c "SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'atlas_schema_revisions');" 2>/dev/null || echo "false")
    if [ "$HAS_ATLAS_TABLE" = "f" ]; then
      HAS_TABLES=$(psql "$DB_URL" -Atq -c "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'atlas_%');" 2>/dev/null || echo "false")
      if [ "$HAS_TABLES" = "t" ]; then
        LATEST="$("$ATLAS_BIN" migrate list --dir "$MIGRATIONS_DIR" --format '{{ range . }}{{ .Version }}{{ end }}' 2>/dev/null | tail -1)"
        [ -z "$LATEST" ] && LATEST=$(ls -1 "$PROJECT_DIR/migrations/"*.sql | sort | tail -1 | xargs basename | cut -d_ -f1)
        echo "Database has tables but no migration tracking. Baselining at $LATEST..."
        "$ATLAS_BIN" migrate set "$LATEST" --dir "$MIGRATIONS_DIR" --url "$DB_URL" 2>/dev/null || true
        return
      fi
    fi
    echo "Applying pending migrations..."
    "$ATLAS_BIN" migrate apply \
      --dir "$MIGRATIONS_DIR" \
      --url "$DB_URL"
    ;;

  status)
    ensure_atlas
    "$ATLAS_BIN" migrate status \
      --dir "$MIGRATIONS_DIR" \
      --url "$DB_URL"
    ;;

  inspect)
    ensure_atlas
    "$ATLAS_BIN" schema inspect -u "$DB_URL" --format '{{ sql . }}'
    ;;

  reset)
    ensure_atlas
    echo "Dropping all tables..."
    psql "$DB_URL" -c "DROP SCHEMA IF EXISTS atlas_schema_revisions CASCADE;"
    psql "$DB_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    echo "Running migrations from scratch..."
    "$ATLAS_BIN" migrate apply --dir "$MIGRATIONS_DIR" --url "$DB_URL"
    echo "Seeding data..."
    cd "$PROJECT_DIR" && unset DATABASE_URL && .venv/bin/python seed.py
    ;;

  fresh)
    ensure_atlas
    ADMIN_URL="postgres://postgres@localhost:5432/postgres?sslmode=disable"
    echo "Dropping database..."
    psql "$ADMIN_URL" -c "DROP DATABASE IF EXISTS estore WITH (FORCE);" 2>/dev/null || psql "$ADMIN_URL" -c "DROP DATABASE IF EXISTS estore;"
    echo "Creating database..."
    psql "$ADMIN_URL" -c "CREATE DATABASE estore;"
    echo "Running all migrations from scratch..."
    "$ATLAS_BIN" migrate apply --dir "$MIGRATIONS_DIR" --url "$DB_URL"
    echo "Seeding data..."
    cd "$PROJECT_DIR" && unset DATABASE_URL && .venv/bin/python seed.py
    ;;

  help|--help|-h)
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  init          Generate initial migration from current DB"
    echo "  diff <name>   Generate a new migration after model changes"
    echo "  apply         Run pending migrations"
    echo "  reset         Drop all tables, re-run migrations, re-seed"
    echo "  fresh         Drop entire DB, recreate, run all migrations, re-seed"
    echo "  status        Show migration status"
    echo "  inspect       Dump current DB schema as SQL"
    ;;

  *)
    echo "Unknown command: $1" >&2
    exit 1
    ;;
esac
