# Troubleshooting Guide

Common issues and how to resolve them.

---

## Application won't start

### "INVALID ENVIRONMENT CONFIGURATION — APP CANNOT START"

The app validates all environment variables at startup. If any required variable is missing:

1. Check that `.env.local` exists: `ls -la .env.local`
2. Copy from the example: `cp .env.example .env.local`
3. Fill in the required values (see README.md for the full list)
4. Restart: `pm2 restart schoolos`

### "Cannot connect to database" / Prisma connection error

```
Error: Can't reach database server at localhost:5432
```

1. Check PostgreSQL is running: `systemctl status postgresql`
2. Start it if stopped: `systemctl start postgresql`
3. Verify the connection string: `psql "$DATABASE_URL" -c "SELECT 1;"`
4. Check that the database user exists:
   ```bash
   sudo -u postgres psql -c "\du"
   ```
5. Check pg_hba.conf allows local connections:
   ```bash
   grep -v "^#" /etc/postgresql/16/main/pg_hba.conf | grep -v "^$"
   ```

### "The table `public.schools` does not exist"

Migrations haven't run:
```bash
npx prisma migrate deploy
```

If that fails, check `DATABASE_URL` is set and the database is reachable.

---

## Authentication issues

### Stuck in redirect loop at `/login`

The session cookie may be corrupt or from an old format. Clear it by:
1. Opening the browser DevTools → Application → Cookies → delete `schoolos-session`
2. Reload the page

### "Access denied" on pages the user should see

1. Check the user's role in the database: `SELECT email, role, school_id FROM users WHERE email = 'user@example.com';`
2. Verify the navigation item is in `lib/navigation.ts` with the correct `allowedRoles`
3. Check the session is correctly setting `x-session-role` in middleware logs

### SUPER_ADMIN can't access `/super-admin`

The middleware checks `role === "SUPER_ADMIN"` from the session cookie. If the session was created before the role was updated in the DB, log out and log back in.

---

## Rate limiting

### "Too many requests" on login

The login endpoint allows 5 attempts per 15 minutes per IP. Wait 15 minutes, or:
- If using the in-memory rate limiter (single process), restart the app: `pm2 restart schoolos` (this clears the store — for emergencies only)
- Check if the user's IP is being rate limited due to a shared NAT/proxy

### Rate limiting not working across multiple processes

The default rate limiter is in-memory. For multiple Node processes or PM2 cluster mode:
1. Install Upstash Redis: `npm install @upstash/ratelimit @upstash/redis`
2. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env.local`
3. Update `lib/rate-limit.ts` to use the Upstash adapter (see comments in the file)

---

## Database issues

### Prisma migration failed

```
Error: There are 1 unapplied migration(s)
```

Run: `npx prisma migrate deploy`

If a migration is in a failed state:
```bash
# Check migration status
npx prisma migrate status

# Mark a failed migration as rolled back (use with caution)
npx prisma migrate resolve --rolled-back <migration-name>
```

### "Too many database connections"

The Prisma singleton in `lib/db.ts` prevents multiple clients in development. In production:
1. Check the connection pool: `SELECT count(*) FROM pg_stat_activity;`
2. Default max connections in PostgreSQL is 100. For multiple PM2 processes, reduce the pool per process:
   ```
   DATABASE_URL="postgresql://...?connection_limit=10"
   ```
3. Or use PgBouncer as a connection pooler

### Database disk full

```bash
# Check disk usage
df -h

# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('refugee_schoolos'));"

# Find large tables
sudo -u postgres psql refugee_schoolos -c "
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;"

# Clean up old audit logs (beyond retention period)
# DELETE FROM sensitive_audit_logs WHERE created_at < NOW() - INTERVAL '365 days';
```

---

## File upload issues

### "File content does not match the declared type"

The upload validator checks magic bytes (file signature) against the declared MIME type. This error means:
- The file is corrupt, or
- The file extension doesn't match its actual content (e.g., a renamed `.exe`)

The file is rejected for security reasons. Ask the user to re-export the file in the correct format.

### "File too large"

Size limits per category:
- Documents: 10 MB
- Images / logos: 5 MB (logo: 2 MB)
- Videos: 500 MB

Ask the user to compress the file. For videos, suggest using HandBrake or ffmpeg.

---

## Subdomain routing

### Subdomain not resolving in development

1. Add the subdomain to `/etc/hosts`: `127.0.0.1 monrlc.localhost`
2. Set `NEXT_PUBLIC_BASE_DOMAIN=localhost` in `.env.local`
3. Visit `http://monrlc.localhost:3000/dashboard`

### School data not loading on subdomain

1. Check the school's `subdomain` field in the database matches the URL slug
2. Verify middleware is setting the `x-school-subdomain` header (add `console.log` in middleware temporarily)
3. Check `lib/schools.ts` `getSchoolBySubdomain()` is finding the school

---

## Nginx / SSL

### 502 Bad Gateway

Node.js app is not running:
```bash
pm2 status
pm2 restart schoolos
pm2 logs schoolos --lines 50
```

### SSL certificate expired

```bash
# Check expiry
certbot certificates

# Renew
certbot renew

# If automatic renewal failed, check the timer
systemctl status certbot.timer
journalctl -u certbot
```

### Mixed content warnings in browser

Ensure `NEXTAUTH_URL` and `NEXT_PUBLIC_BASE_DOMAIN` use `https://` in production. The CSP header `upgrade-insecure-requests` should handle this for inline resources.

---

## Performance

### Slow page loads

1. Check PM2 memory: `pm2 monit`
2. Check PostgreSQL slow queries:
   ```sql
   SELECT query, calls, total_exec_time / calls AS avg_ms
   FROM pg_stat_statements
   ORDER BY avg_ms DESC
   LIMIT 20;
   ```
3. Add `?schema=public` to your DATABASE_URL if not present
4. Check if indexes exist: `npx prisma migrate status`

### High memory usage

1. Check for memory leaks: `pm2 monit` — watch RSS over time
2. The in-memory rate limiter store grows with unique IPs. It prunes idle entries every 5 minutes. Restart the app if memory is critical.
3. Consider PM2 `--max-memory-restart` flag:
   ```bash
   pm2 start npm --name schoolos --max-memory-restart 512M -- start
   ```

---

## Getting help

1. Check application logs: `pm2 logs schoolos`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Check PostgreSQL logs: `tail -f /var/log/postgresql/postgresql-16-main.log`
4. Run health check: `./scripts/health-check.sh`
