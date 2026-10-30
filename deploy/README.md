# Deploy — macs.mn (103.143.40.48, same server as docs.macs.mn)

macs.mn has its own Postgres database `macs_site` holding:
- **content** — every text on the site in MN and EN, edited at `macs.mn/admin/content` (`ContentSection`; `content/mn.ts` / `content/en.ts` are the seed and the fallback when the database is empty or unreachable),
- **admins** — managed at `/admin/users`,
- **quote requests and contact messages** — listed at `/admin/requests` and `/admin/messages`. Each one is emailed from `no_reply@infosystems.mn` (smtp.mail.mn) to `NOTIFY_TO` (contact@infosystems.mn), with the visitor in CC as their confirmation. Spam protection: reCAPTCHA v2, a honeypot field and 3 requests / 10 min per IP.

The server runs every app under **pm2** (user `ubuntu`, Node 22 from nvm) behind **nginx** with certbot TLS:

| App | pm2 name | Dir | Port |
|---|---|---|---|
| docs.macs.mn | `macs_documents` | `~/macs_documents` | 3004 |
| macs.mn | `macs_mn` | `~/macs.mn` | 3030 |

> The system `/usr/bin/node` is v18, too old for Next 16. Always put nvm's Node 22 first in `PATH` before `npm`/`pm2` commands, especially `pm2 restart --update-env` (it copies your shell's PATH into the app):
> `export PATH=$HOME/.nvm/versions/node/v22.21.1/bin:$PATH`

## Database (once)

```sql
CREATE ROLE macs_site WITH LOGIN PASSWORD '…';
CREATE DATABASE macs_site OWNER macs_site;
```

## `.env`

See `.env.example`. On the server: `SITE_URL=https://macs.mn`, `DATABASE_URL` for the role above, a pinned `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (otherwise forms open during a deploy fail), the `SMTP_*` + `NOTIFY_TO` settings and the reCAPTCHA keys. Quote `SMTP_PASS` if it contains `#`.

## First deploy

```bash
export PATH=$HOME/.nvm/versions/node/v22.21.1/bin:$PATH
cd ~/macs.mn
npm ci
npm run db:migrate:deploy
npm run db:seed-content          # fills missing sections only; never overwrites admin edits
npm run db:seed-admin            # ADMIN_EMAIL / ADMIN_PASSWORD
npm run build
pm2 start npm --name macs_mn -- start -- -p 3030
pm2 save
```

## nginx + TLS (needs sudo)

```bash
sudo cp ~/macs.mn/deploy/nginx-macs.mn.conf /etc/nginx/sites-available/macs.mn
sudo ln -s /etc/nginx/sites-available/macs.mn /etc/nginx/sites-enabled/macs.mn
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d macs.mn -d www.macs.mn
```
The nginx config overwrites `X-Forwarded-For` with the client address; the forms rate-limit per IP on it.
It also raises `client_max_body_size` to 11m for support-request attachments — after changing the
config, copy it again and run `sudo nginx -t && sudo systemctl reload nginx`.

## Redeploys

```bash
export PATH=$HOME/.nvm/versions/node/v22.21.1/bin:$PATH
cd ~/macs.mn
git pull
npm ci
npm run db:migrate:deploy
npm run build
pm2 restart macs_mn --update-env
```

Content is read from the database at build time and cached until an admin saves (`updateTag("content")`), so a rebuild doesn't lose edits. If the database is unreachable during a build, pages fall back to the built-in text until the next save or rebuild.
