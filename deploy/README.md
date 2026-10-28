# Deploy — macs.mn (same Ubuntu server as docs.macs.mn)

The site runs on port **3001** next to the docs site (port 3000), behind the same Caddy, and uses its own database `macs_site` on the same PostgreSQL instance.

## 1. PostgreSQL

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE macs_site WITH LOGIN PASSWORD 'CHANGE_ME';
CREATE DATABASE macs_site OWNER macs_site;
SQL
```

For local development `prisma migrate dev` also needs a shadow database, so give the local role `CREATEDB` (`ALTER ROLE macs_site CREATEDB;`). Production uses `migrate deploy` and does not need it.

## 2. Node + app

Node 24+, in `/srv/macs-site` (owned by user `macssite`):
```bash
npm ci
npx prisma generate
npm run db:migrate:deploy
npm run build
npm run db:seed-admin   # first deploy only, or to reset the admin password
```

## 3. `.env` on the server

```
DATABASE_URL=postgresql://macs_site:CHANGE_ME@localhost:5432/macs_site
SESSION_SECRET=<openssl rand -base64 32>
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=<openssl rand -base64 32>
ADMIN_EMAIL=<admin email>
ADMIN_PASSWORD=<admin password, 8+ chars>
SITE_URL=https://macs.mn

# Quote notification email (optional — requests are always saved to the DB)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
NOTIFY_TO=contact@infosystems.mn
```

`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` must be pinned, otherwise Server Action IDs rotate on every build and forms open during a deploy fail.

## 4. systemd

```bash
sudo cp deploy/macs-site.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now macs-site
```

## 5. Caddy

Append `deploy/Caddyfile` to `/etc/caddy/Caddyfile`, point the `macs.mn` and `www.macs.mn` DNS A records at the server, then `sudo systemctl reload caddy`.

Caddy sets `X-Forwarded-For` and drops the client-supplied value, which the quote form's per-IP rate limit relies on. Don't expose port 3001 directly.

## 6. Redeploys

```bash
git pull
npm ci
npx prisma generate
npm run db:migrate:deploy
npm run build
sudo systemctl restart macs-site
```

## Admin

- `https://macs.mn/admin` — quote requests (Үнийн санал).
- `https://macs.mn/admin/messages` — contact form messages (Санал хүсэлт).

Both filter by status (Шинэ / Холбогдсон / Хаасан) and take a follow-up note. Requests from the English site are marked **EN**.
