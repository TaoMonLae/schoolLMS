# Backup and Restore Guide

This document describes how to back up and restore the Refugee SchoolOS database.

---

## Overview

SchoolOS uses PostgreSQL. Backups are created with `pg_dump` (custom format, compressed with gzip). The backup script (`scripts/backup.sh`) handles retention automatically.

**Backup location**: `/var/backups/schoolos/` (configurable)
**Backup format**: `schoolos_YYYYMMDD_HHMMSS.sql.gz`
**Retention**: 30 days by default (configurable via `RETENTION_DAYS`)

---

## Creating a backup

### Manual backup

```bash
cd /home/deploy/schoolos
./scripts/backup.sh
```

Example output:
```
[INFO] 2024-01-15T02:00:01+00:00 Starting backup → /var/backups/schoolos/schoolos_20240115_020001.sql.gz
[INFO] Backup complete. Size: 4.2M
[INFO] Removing backups older than 30 days from /var/backups/schoolos ...
[INFO] Done. 12 backup(s) retained.
[INFO] 2024-01-15T02:00:08+00:00 Backup job finished successfully.
```

### Automated daily backup

Add to crontab (`crontab -e`):

```cron
# SchoolOS daily backup at 2:00 AM
0 2 * * * /home/deploy/schoolos/scripts/backup.sh >> /var/log/schoolos-backup.log 2>&1
```

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | (required) | PostgreSQL connection string |
| `BACKUP_DIR` | `/var/backups/schoolos` | Where to store backup files |
| `RETENTION_DAYS` | `30` | Delete backups older than this many days |
| `BACKUP_S3_BUCKET` | (unset) | If set, upload to this S3/R2 bucket |

### Uploading to Cloudflare R2 (recommended for production)

```bash
# Install AWS CLI (works with R2)
apt-get install -y awscli

# Configure R2 credentials
aws configure --profile r2
# AWS Access Key ID: <your R2 access key>
# AWS Secret Access Key: <your R2 secret key>
# Default region: auto
# Default output format: json

# Set endpoint in .env.local
# BACKUP_S3_BUCKET="schoolos-backups"
# AWS_ENDPOINT_URL="https://<account-id>.r2.cloudflarestorage.com"
```

---

## Restoring from a backup

> **Warning**: Restore DROPS the existing database. Always take a fresh backup before restoring, and perform restores during a maintenance window.

### Step 1: Take a safety backup of current state

```bash
./scripts/backup.sh
```

### Step 2: Put the application in maintenance mode

```bash
# Stop the app so no writes happen during restore
pm2 stop schoolos
```

### Step 3: Run the restore script

```bash
./scripts/restore.sh /var/backups/schoolos/schoolos_20240115_020001.sql.gz
```

The script will:
1. Show you what it's about to do and ask for confirmation
2. Drop the existing database
3. Create a new empty database
4. Restore the backup via `pg_restore`
5. Run `prisma migrate deploy` to ensure the schema is current

### Step 4: Restart the application

```bash
pm2 start schoolos
pm2 logs schoolos --lines 50  # Check for errors
./scripts/health-check.sh     # Verify everything is healthy
```

---

## Point-in-time recovery with WAL archiving

For zero-data-loss recovery in production, enable PostgreSQL WAL archiving:

```bash
# In /etc/postgresql/16/main/postgresql.conf:
wal_level = replica
archive_mode = on
archive_command = 'cp %p /var/backups/schoolos/wal/%f'
```

This allows recovery to any point in time between daily backups, not just to the backup snapshot.

---

## Verifying a backup

To verify a backup is readable without restoring it to production:

```bash
# Check the backup is a valid gzip file
gunzip -t /var/backups/schoolos/schoolos_20240115_020001.sql.gz && echo "File is valid"

# List the tables in the backup (without restoring)
gunzip -c /var/backups/schoolos/schoolos_20240115_020001.sql.gz \
  | pg_restore --list \
  | grep "TABLE DATA"
```

---

## Disaster recovery checklist

If the Droplet is lost or corrupted:

1. Provision a new DigitalOcean Droplet (see `docs/deployment-digitalocean.md`)
2. Install PostgreSQL and create the database user
3. Deploy the application code
4. Copy the latest backup from R2/S3 or DigitalOcean Spaces
5. Run `./scripts/restore.sh <backup-file>`
6. Update DNS if the IP address changed
7. Run `./scripts/health-check.sh` to verify

Target RTO (Recovery Time Objective): ~1 hour with automated backups in R2.
Target RPO (Recovery Point Objective): 24 hours with daily backups; ~seconds with WAL archiving.
