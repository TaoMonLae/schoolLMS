# Refugee SchoolOS
Built by Tao Mon Lae

A multi-tenant Learning Management System built for refugee learning centres. Each school gets its own isolated data environment, accessible via subdomain (`school.refugeeschoolos.com`) or a custom domain. 

---

## Quick start

```bash
# 1. Clone and install
git clone <repo>
cd _SchoolLMS
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your PostgreSQL URL and secrets

# 3. Set up the database
npx prisma migrate dev

# 4. Run in development
npm run dev
```

Visit `http://localhost:3000`.

---

## Architecture

### Multi-tenancy

Every model in the database has a `school_id` foreign key. Tenant isolation is enforced at two levels:

1. **Query layer** — every `db.*` call includes `where: { schoolId }` derived from the authenticated user's session. The `tenantFilter()` helper in `lib/tenant.ts` builds this filter and ignores any explicit `schoolId` passed by non-SUPER_ADMIN users (preventing override attacks).

2. **Safety net** — `filterToTenant()` is called on every data-fetching function's return value. Even if a developer accidentally omits the `where` clause, no cross-school records leak.

### Directory structure

```
app/
  dashboard/      — school-scoped user interface
  super-admin/    — SUPER_ADMIN-only school management
  login/          — authentication pages
  error.tsx       — route-level error boundary
  global-error.tsx — root layout error boundary
  not-found.tsx   — 404 page
lib/
  db.ts           — Prisma singleton
  session.ts      — cookie session (base64url; migrate to NextAuth for production)
  tenant.ts       — tenant isolation helpers and TenantAccessError
  rbac.ts         — role permissions map and helpers
  audit.ts        — audit logging to SensitiveAuditLog table
  rate-limit.ts   — in-memory sliding-window rate limiter
  validation.ts   — Zod schemas for all form inputs
  errors.ts       — AppError hierarchy and server action error helpers
  env.ts          — environment variable validation (Zod, crashes on missing vars)
  logger.ts       — PII-safe structured logger
  upload-validation.ts — magic-byte MIME verification and file size limits
  schools.ts      — school CRUD (SUPER_ADMIN only writes)
  students.ts     — student data with tenant filtering
  branding.ts     — school branding helpers
  navigation.ts   — role-filtered navigation items
prisma/
  schema.prisma   — database schema
scripts/
  backup.sh       — pg_dump backup with retention policy
  restore.sh      — database restore
  health-check.sh — application health check
docs/
  deployment-digitalocean.md — production deployment guide
  backup-restore.md          — backup and restore procedures
  troubleshooting.md         — common issues and fixes
```

### Roles

| Role | Access level |
|------|-------------|
| `SUPER_ADMIN` | All schools, all data, school management |
| `SCHOOL_ADMIN` | Own school: all data, user management, branding |
| `TEACHER` | Own school: students (read), attendance, library, LMS, grades |
| `STUDENT` | Own records: profile, classes, grades, library, videos |
| `CASE_MANAGER` | Own school: student records (read), sensitive documents, support cases |

### Subdomain routing

Middleware (`middleware.ts`) reads the `host` header, extracts the school subdomain, and injects it as `x-school-subdomain` for server components to resolve.

For local development with subdomain testing:
1. Add `127.0.0.1 monrlc.localhost` to `/etc/hosts`
2. Set `NEXT_PUBLIC_BASE_DOMAIN=localhost` in `.env.local`
3. Visit `http://monrlc.localhost:3000/dashboard`

---

## Security

### What is implemented

- **Tenant isolation** — two-layer defence (query filter + post-fetch safety net)
- **Role-based access control** — 5 roles, granular permission strings, `hasPermission()` helper
- **Audit logging** — all sensitive operations write to `SensitiveAuditLog`
- **Input validation** — Zod schemas on all server action inputs
- **Password hashing** — bcrypt with 12 rounds (cost factor configurable via `BCRYPT_ROUNDS`)
- **Rate limiting** — sliding-window limiter; login 5/15 min, API 100/min, super-admin 30/min
- **Secure HTTP headers** — CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **File upload validation** — magic-byte MIME verification, blocked extension list, size limits
- **PII-safe logging** — `lib/logger.ts` strips passwords, tokens, document numbers, UNHCR IDs
- **Environment validation** — app crashes immediately on missing required env vars

### Known gaps (address before production)

- **Session** — currently unsigned base64url cookie. Migrate to NextAuth.js:
  ```bash
  npm install next-auth @auth/prisma-adapter
  ```
- **Rate limiting** — in-memory only; replace with Upstash Redis for multi-process deployments
- **Content Security Policy** — currently uses `unsafe-inline`; implement nonce-based CSP for hardened deployments
- **File storage** — school logos accept a public URL; implement server-side upload with magic-byte validation for production

---

## Testing

```bash
# Run tenant isolation tests (40 tests)
npx tsx --test lib/tenant.test.ts

# Run RBAC permission tests
npx tsx --test lib/rbac.test.ts

# Run all tests
npx tsx --test lib/*.test.ts
```

---

## Database

### Migrations

```bash
# Development (creates migration files)
npx prisma migrate dev --name describe-your-change

# Production (applies pending migrations)
npx prisma migrate deploy

# Inspect the current database state
npx prisma studio
```

### Backup

```bash
# Manual backup
./scripts/backup.sh

# Restore from a backup
./scripts/restore.sh /var/backups/schoolos/schoolos_20240115_020000.sql.gz
```

See `docs/backup-restore.md` for the full procedure.

---

## Deployment

See `docs/deployment-digitalocean.md` for a complete guide covering:
- DigitalOcean Droplet setup
- PostgreSQL installation and hardening
- Nginx reverse proxy with SSL (Let's Encrypt)
- PM2 process management
- Environment configuration

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Session signing secret (≥32 chars) |
| `NEXTAUTH_URL` | ✅ | App's public URL |
| `NEXT_PUBLIC_BASE_DOMAIN` | ✅ | Base domain for subdomains |
| `BCRYPT_ROUNDS` | — | bcrypt cost factor (default: 12) |
| `AUDIT_LOG_RETENTION_DAYS` | — | Days to keep audit logs (default: 365) |
| `UPSTASH_REDIS_REST_URL` | — | Redis URL for multi-instance rate limiting |
| `STORAGE_*` | — | Object storage for file uploads |

---

## Stack

- **Next.js 15** — App Router, Server Components, Server Actions
- **TypeScript** — strict mode
- **Prisma** — ORM with PostgreSQL
- **Tailwind CSS** — utility-first styling
- **Zod** — runtime input validation
- **bcryptjs** — password hashing
- **Lucide React** — icons

---

## Contributing

1. All new data-fetching functions must call `filterToTenant(user, results)` on return values
2. All server actions must validate inputs with a Zod schema from `lib/validation.ts`
3. Sensitive operations (student data access, auth events) must call `audit.*` from `lib/audit.ts`
4. Never log PII — use `logger` from `lib/logger.ts` which auto-redacts sensitive fields
5. Run `npx tsx --test lib/*.test.ts` before merging
