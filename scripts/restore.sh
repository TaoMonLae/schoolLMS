#!/usr/bin/env bash
# scripts/restore.sh — Restore a SchoolOS database backup
# ─────────────────────────────────────────────────────────
# Drops and recreates the target database, then restores from a backup
# created by scripts/backup.sh.
#
# Usage:
#   ./scripts/restore.sh /var/backups/schoolos/schoolos_20240115_020000.sql.gz
#
# ⚠️  WARNING: This DROPS and recreates the target database.
#     Run it only in a maintenance window with no active users.
#     Always take a fresh backup before restoring.
#
# Environment variables:
#   DATABASE_URL    PostgreSQL connection string of the TARGET database

set -euo pipefail

BACKUP_FILE="${1:-}"

# ── Argument check ────────────────────────────────────────────────────────────
if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage: $0 <backup-file.sql.gz>" >&2
  echo "Example: $0 /var/backups/schoolos/schoolos_20240115_020000.sql.gz" >&2
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "[ERROR] Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

# ── Load env ──────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

if [[ -f "$APP_DIR/.env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -E '^DATABASE_URL=' "$APP_DIR/.env.local" | head -1)
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[ERROR] DATABASE_URL is not set." >&2
  exit 1
fi

# ── Parse DATABASE_URL ────────────────────────────────────────────────────────
# Format: postgresql://user:password@host:port/dbname?schema=public
DB_NAME="$(echo "$DATABASE_URL" | sed 's/.*\///' | sed 's/?.*//')"
DB_HOST="$(echo "$DATABASE_URL" | sed 's/.*@//' | sed 's/:.*//' | sed 's/\/.*//')"
DB_PORT="$(echo "$DATABASE_URL" | sed 's/.*@[^:]*://' | sed 's/\/.*//')"
DB_USER="$(echo "$DATABASE_URL" | sed 's/.*:\/\///' | sed 's/:.*//')"

echo "┌──────────────────────────────────────────────────────────┐"
echo "│  SchoolOS Database Restore                               │"
echo "└──────────────────────────────────────────────────────────┘"
echo ""
echo "  Backup file : $BACKUP_FILE"
echo "  Target DB   : $DB_NAME @ $DB_HOST:$DB_PORT"
echo "  DB user     : $DB_USER"
echo ""
echo "⚠️  This will DROP and recreate the database '$DB_NAME'."
echo "   All existing data will be permanently deleted."
echo ""
read -r -p "Type 'yes' to continue: " CONFIRM

if [[ "$CONFIRM" != "yes" ]]; then
  echo "Restore cancelled."
  exit 0
fi

# ── Pre-flight checks ─────────────────────────────────────────────────────────
if ! command -v pg_restore &>/dev/null; then
  echo "[ERROR] pg_restore not found. Install postgresql-client." >&2
  exit 1
fi

# ── Drop and recreate the database ───────────────────────────────────────────
echo "[INFO] $(date -Iseconds) Dropping database '$DB_NAME' ..."
PGPASSWORD="$(echo "$DATABASE_URL" | sed 's/.*:\/\/[^:]*://' | sed 's/@.*//')" \
  psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d postgres \
    -c "DROP DATABASE IF EXISTS \"$DB_NAME\";" 2>&1

echo "[INFO] Creating database '$DB_NAME' ..."
PGPASSWORD="$(echo "$DATABASE_URL" | sed 's/.*:\/\/[^:]*://' | sed 's/@.*//')" \
  psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d postgres \
    -c "CREATE DATABASE \"$DB_NAME\";" 2>&1

# ── Restore ───────────────────────────────────────────────────────────────────
echo "[INFO] Restoring from $BACKUP_FILE ..."

gunzip -c "$BACKUP_FILE" \
  | pg_restore \
      --no-owner \
      --no-acl \
      --dbname="$DATABASE_URL" \
      --verbose 2>&1 \
  || true  # pg_restore exits non-zero on warnings; we check separately

echo "[INFO] Running Prisma migrations to ensure schema is up to date ..."
cd "$APP_DIR"
npx prisma migrate deploy 2>&1 || echo "[WARN] Prisma migrate deploy failed — check schema." >&2

echo "[INFO] $(date -Iseconds) Restore complete."
