#!/usr/bin/env bash
# scripts/health-check.sh — SchoolOS application health check
# ─────────────────────────────────────────────────────────────
# Checks:
#   1. App HTTP endpoint responds with 200
#   2. Database connection succeeds
#   3. Disk usage is below threshold
#   4. Memory usage is reasonable
#
# Usage:
#   ./scripts/health-check.sh [--app-url http://localhost:3000]
#
# Exit codes:
#   0 = all checks passed
#   1 = one or more checks failed
#
# For use with uptime monitors or PM2's --watch:
#   pm2 start health-check.sh --cron "*/5 * * * *"

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────
APP_URL="${APP_URL:-http://localhost:3000}"
DISK_THRESHOLD_PCT="${DISK_THRESHOLD_PCT:-80}"
TIMEOUT_SECONDS=10
FAILED=0

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # no colour

pass() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; FAILED=1; }
warn() { echo -e "${YELLOW}!${NC} $1"; }

echo "══════════════════════════════════════════"
echo "  SchoolOS Health Check — $(date '+%Y-%m-%d %H:%M:%S')"
echo "══════════════════════════════════════════"
echo ""

# ── 1. HTTP endpoint ──────────────────────────────────────────────────────────
echo "Checking HTTP endpoint ($APP_URL) ..."
if command -v curl &>/dev/null; then
  HTTP_STATUS="$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT_SECONDS" "$APP_URL" 2>/dev/null || echo "000")"
  if [[ "$HTTP_STATUS" == "200" || "$HTTP_STATUS" == "307" || "$HTTP_STATUS" == "302" ]]; then
    pass "App is responding (HTTP $HTTP_STATUS)"
  else
    fail "App returned HTTP $HTTP_STATUS (expected 200)"
  fi
else
  warn "curl not found — skipping HTTP check"
fi

# ── 2. Database connection ────────────────────────────────────────────────────
echo ""
echo "Checking database connection ..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

if [[ -f "$APP_DIR/.env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -E '^DATABASE_URL=' "$APP_DIR/.env.local" | head -1)
  set +a
fi

if [[ -n "${DATABASE_URL:-}" ]] && command -v psql &>/dev/null; then
  if psql "$DATABASE_URL" -c "SELECT 1;" &>/dev/null 2>&1; then
    pass "Database connection successful"

    # Row count sanity check
    SCHOOL_COUNT="$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM schools;" 2>/dev/null | tr -d ' ' || echo 'N/A')"
    pass "Schools in database: $SCHOOL_COUNT"
  else
    fail "Cannot connect to database"
  fi
elif [[ -z "${DATABASE_URL:-}" ]]; then
  warn "DATABASE_URL not set — skipping database check"
else
  warn "psql not found — skipping database check"
fi

# ── 3. Disk usage ─────────────────────────────────────────────────────────────
echo ""
echo "Checking disk usage ..."
DISK_PCT="$(df / | awk 'NR==2 {gsub(/%/, "", $5); print $5}')"
if [[ "$DISK_PCT" -lt "$DISK_THRESHOLD_PCT" ]]; then
  pass "Disk usage: ${DISK_PCT}% (threshold: ${DISK_THRESHOLD_PCT}%)"
else
  fail "Disk usage is high: ${DISK_PCT}% (threshold: ${DISK_THRESHOLD_PCT}%)"
fi

# Backup directory size (informational)
BACKUP_DIR="${BACKUP_DIR:-/var/backups/schoolos}"
if [[ -d "$BACKUP_DIR" ]]; then
  BACKUP_SIZE="$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)"
  pass "Backup directory size: $BACKUP_SIZE"
fi

# ── 4. Memory usage ───────────────────────────────────────────────────────────
echo ""
echo "Checking memory ..."
if command -v free &>/dev/null; then
  MEM_PCT="$(free | awk '/^Mem:/ {printf "%.0f", ($3/$2)*100}')"
  if [[ "$MEM_PCT" -lt 90 ]]; then
    pass "Memory usage: ${MEM_PCT}%"
  else
    warn "Memory usage is high: ${MEM_PCT}%"
  fi
fi

# ── 5. PM2 process check (if PM2 is running) ─────────────────────────────────
echo ""
echo "Checking PM2 process ..."
if command -v pm2 &>/dev/null; then
  if pm2 list 2>/dev/null | grep -q "schoolos"; then
    PM2_STATUS="$(pm2 list 2>/dev/null | grep "schoolos" | awk '{print $10}')"
    if [[ "$PM2_STATUS" == "online" ]]; then
      pass "PM2 process 'schoolos' is online"
    else
      fail "PM2 process 'schoolos' is not online (status: $PM2_STATUS)"
    fi
  else
    warn "PM2 process 'schoolos' not found"
  fi
else
  warn "PM2 not found — skipping process check"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════"
if [[ "$FAILED" -eq 0 ]]; then
  echo -e "${GREEN}All health checks passed.${NC}"
else
  echo -e "${RED}One or more health checks FAILED.${NC}"
fi
echo "══════════════════════════════════════════"

exit "$FAILED"
