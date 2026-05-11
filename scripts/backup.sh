#!/usr/bin/env bash
# scripts/backup.sh — PostgreSQL backup with retention policy
# ─────────────────────────────────────────────────────────────
# Creates a compressed pg_dump of the SchoolOS database and
# removes backups older than RETENTION_DAYS.
#
# Usage:
#   ./scripts/backup.sh
#
# Environment variables (can be set in .env or as shell exports):
#   DATABASE_URL        PostgreSQL connection string (required)
#   BACKUP_DIR          Directory to store backups (default: /var/backups/schoolos)
#   RETENTION_DAYS      How many days to keep backups (default: 30)
#   BACKUP_S3_BUCKET    If set, upload backup to this S3/R2 bucket after creation
#
# Suggested cron (daily at 2 AM):
#   0 2 * * * /path/to/app/scripts/backup.sh >> /var/log/schoolos-backup.log 2>&1
#
# Restore:
#   See scripts/restore.sh

set -euo pipefail

# ── Load .env if present ──────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

if [[ -f "$APP_DIR/.env.local" ]]; then
  # Export only DATABASE_URL if present in .env.local
  set -a
  # shellcheck disable=SC1091
  source <(grep -E '^DATABASE_URL=' "$APP_DIR/.env.local" | head -1)
  set +a
fi

# ── Configuration ─────────────────────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/var/backups/schoolos}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="schoolos_${TIMESTAMP}.sql.gz"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

# ── Pre-flight checks ─────────────────────────────────────────────────────────
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[ERROR] DATABASE_URL is not set. Set it in .env.local or export it." >&2
  exit 1
fi

if ! command -v pg_dump &>/dev/null; then
  echo "[ERROR] pg_dump not found. Install postgresql-client." >&2
  exit 1
fi

if ! command -v gzip &>/dev/null; then
  echo "[ERROR] gzip not found." >&2
  exit 1
fi

# ── Create backup directory ───────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

echo "[INFO] $(date -Iseconds) Starting backup → $BACKUP_PATH"

# ── Run pg_dump ───────────────────────────────────────────────────────────────
# --no-owner: omit ownership commands (safe when restoring to a different user)
# --no-acl:   omit GRANT/REVOKE (re-apply separately if needed)
# -Fc:        custom format (allows selective restore with pg_restore)
#
# Note: Using -Fc (custom format) is preferred over plain SQL for large DBs.
# To get a plain .sql.gz instead, use: pg_dump "$DATABASE_URL" | gzip > ...

pg_dump \
  --no-owner \
  --no-acl \
  --format=custom \
  "$DATABASE_URL" \
  | gzip \
  > "$BACKUP_PATH"

BACKUP_SIZE="$(du -h "$BACKUP_PATH" | cut -f1)"
echo "[INFO] Backup complete. Size: $BACKUP_SIZE"

# ── Optional: upload to S3 / Cloudflare R2 ───────────────────────────────────
if [[ -n "${BACKUP_S3_BUCKET:-}" ]]; then
  if command -v aws &>/dev/null; then
    echo "[INFO] Uploading to s3://$BACKUP_S3_BUCKET/$BACKUP_FILE ..."
    aws s3 cp "$BACKUP_PATH" "s3://$BACKUP_S3_BUCKET/$BACKUP_FILE" --storage-class STANDARD_IA
    echo "[INFO] Upload complete."
  else
    echo "[WARN] BACKUP_S3_BUCKET is set but 'aws' CLI not found. Skipping upload." >&2
  fi
fi

# ── Retention: remove backups older than RETENTION_DAYS ──────────────────────
echo "[INFO] Removing backups older than ${RETENTION_DAYS} days from $BACKUP_DIR ..."
find "$BACKUP_DIR" \
  -name "schoolos_*.sql.gz" \
  -type f \
  -mtime "+${RETENTION_DAYS}" \
  -print \
  -delete

REMAINING="$(find "$BACKUP_DIR" -name "schoolos_*.sql.gz" -type f | wc -l | tr -d ' ')"
echo "[INFO] Done. $REMAINING backup(s) retained."
echo "[INFO] $(date -Iseconds) Backup job finished successfully."
