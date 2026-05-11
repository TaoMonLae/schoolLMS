# Deploying SchoolOS on DigitalOcean

This guide covers deploying Refugee SchoolOS on a DigitalOcean Droplet with PostgreSQL, Nginx as a reverse proxy, Let's Encrypt SSL, and PM2 for process management.

---

## 1. Create the Droplet

Recommended minimum spec for up to 5 schools, ~200 concurrent users:
- **Size**: Basic, 2 vCPUs / 4 GB RAM / 80 GB SSD (≈ $24/month)
- **Image**: Ubuntu 22.04 LTS
- **Region**: Choose the closest to your users (Southeast Asia → Singapore `sgp1`)
- **Options**: Enable backups (adds ~20% cost, worth it for production)

After creation, SSH in as root and create a deployment user:

```bash
adduser deploy
usermod -aG sudo deploy
# Copy your SSH key
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

---

## 2. Install dependencies

```bash
# Update system
apt-get update && apt-get upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PostgreSQL 16
apt-get install -y postgresql postgresql-contrib

# Install Nginx
apt-get install -y nginx

# Install Certbot (Let's Encrypt)
apt-get install -y certbot python3-certbot-nginx

# Install PM2 globally
npm install -g pm2

# Install build tools (for native npm modules)
apt-get install -y build-essential git
```

---

## 3. Set up PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

-- Create database and user
CREATE USER schoolos WITH PASSWORD 'use-a-strong-password-here';
CREATE DATABASE refugee_schoolos OWNER schoolos;
GRANT ALL PRIVILEGES ON DATABASE refugee_schoolos TO schoolos;
\q

# Restrict remote access: edit pg_hba.conf
# (The app connects locally, so no remote access needed)
nano /etc/postgresql/16/main/pg_hba.conf
# Ensure this line exists for local connections:
# local   all   all   md5
# host    all   all   127.0.0.1/32   md5

systemctl restart postgresql
```

---

## 4. Deploy the application

```bash
# Switch to deploy user
su - deploy

# Clone the repository
git clone <your-repo-url> /home/deploy/schoolos
cd /home/deploy/schoolos

# Install dependencies
npm ci --production=false

# Configure environment
cp .env.example .env.local
nano .env.local
```

Fill in `.env.local`:

```env
DATABASE_URL="postgresql://schoolos:your-password@localhost:5432/refugee_schoolos?schema=public"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="https://refugeeschoolos.com"
NEXT_PUBLIC_BASE_DOMAIN="refugeeschoolos.com"
NODE_ENV="production"
BCRYPT_ROUNDS="12"
AUDIT_LOG_RETENTION_DAYS="365"
```

Continue deployment:

```bash
# Run database migrations
npx prisma migrate deploy

# Build the Next.js app
npm run build

# Start with PM2
pm2 start npm --name "schoolos" -- start
pm2 save
pm2 startup  # Follow the printed instructions to enable PM2 on boot
```

---

## 5. Configure Nginx

Create the Nginx site configuration:

```bash
nano /etc/nginx/sites-available/schoolos
```

```nginx
# Main domain
server {
    listen 80;
    server_name refugeeschoolos.com www.refugeeschoolos.com;
    # Certbot will update this to redirect to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name refugeeschoolos.com *.refugeeschoolos.com;

    # SSL (filled in by Certbot)
    ssl_certificate /etc/letsencrypt/live/refugeeschoolos.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/refugeeschoolos.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers (in addition to those set by Next.js)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Pass real client IP to Node.js for rate limiting
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Host $host;

    # Proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Next.js static assets — cache aggressively
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

Enable and test:

```bash
ln -s /etc/nginx/sites-available/schoolos /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 6. SSL with Let's Encrypt

```bash
# Wildcard certificate for subdomain routing
certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d refugeeschoolos.com \
  -d "*.refugeeschoolos.com"
```

For wildcard certs, Certbot requires a DNS TXT challenge. Add the `_acme-challenge` TXT record to your DNS provider, then continue.

Set up auto-renewal:

```bash
# Test renewal
certbot renew --dry-run

# Certbot installs a systemd timer automatically; verify:
systemctl status certbot.timer
```

---

## 7. Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

---

## 8. DNS configuration

In your DNS provider (Cloudflare, etc.):

| Type | Name | Value |
|------|------|-------|
| A | `@` | your-droplet-ip |
| A | `www` | your-droplet-ip |
| A | `*` | your-droplet-ip |

The wildcard `*` record routes all school subdomains (`monrlc.refugeeschoolos.com`, etc.) to the same Droplet. Middleware handles the per-school routing.

---

## 9. Set up automated backups

```bash
# Make scripts executable
chmod +x /home/deploy/schoolos/scripts/backup.sh

# Create backup directory
mkdir -p /var/backups/schoolos
chown deploy:deploy /var/backups/schoolos

# Add to crontab (daily at 2 AM)
crontab -e
# Add:
# 0 2 * * * /home/deploy/schoolos/scripts/backup.sh >> /var/log/schoolos-backup.log 2>&1
```

---

## 10. Monitoring

```bash
# View PM2 logs in real-time
pm2 logs schoolos

# View last 200 log lines
pm2 logs schoolos --lines 200

# PM2 monitoring dashboard
pm2 monit

# Run health check
./scripts/health-check.sh
```

---

## Updating the application

```bash
cd /home/deploy/schoolos

# Pull latest changes
git pull

# Install any new dependencies
npm ci --production=false

# Run any new migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Zero-downtime reload
pm2 reload schoolos
```

---

## Environment variables summary

See `.env.example` for the full list. Production-critical variables:

```bash
# Generate a strong NEXTAUTH_SECRET:
openssl rand -base64 48

# Generate a strong database password:
openssl rand -base64 24
```
