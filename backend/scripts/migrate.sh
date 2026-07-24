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

  help|--help|-h)
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  init          Generate initial migration from current DB"
    echo "  diff <name>   Generate a new migration after model changes"
    echo "  apply         Run pending migrations"
    echo "  status        Show migration status"
    echo "  inspect       Dump current DB schema as SQL"
    ;;

  *)
    echo "Unknown command: $1" >&2
    exit 1
    ;;
esac
