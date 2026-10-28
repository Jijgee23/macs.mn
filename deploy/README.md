# Deploy — macs.mn (103.143.40.48, same server as docs.macs.mn)

macs.mn has **no database**. The quote and contact forms are forwarded server-to-server to the docs site (`macs_documents`, `POST /api/site/quote` and `/api/site/contact`), which validates and stores them, emails the team via Resend, and lists them at `docs.macs.mn/admin/requests` and `/admin/messages`.

The server runs every app under **pm2** (user `ubuntu`, Node 22 from nvm) behind **nginx** with certbot TLS:

| App | pm2 name | Dir | Port |
|---|---|---|---|
| docs.macs.mn | `macs_documents` | `~/macs_documents` | 3004 |
| macs.mn | `macs_mn` | `~/macs.mn` | 3030 |

> The system `/usr/bin/node` is v18, too old for Next 16. Always put nvm's Node 22 first in `PATH` before `npm`/`pm2` commands, especially `pm2 restart --update-env` (it copies your shell's PATH into the app):
> `export PATH=$HOME/.nvm/versions/node/v22.21.1/bin:$PATH`

## First deploy

```bash
export PATH=$HOME/.nvm/versions/node/v22.21.1/bin:$PATH
git clone https://github.com/Jijgee23/macs.mn.git ~/macs.mn
cd ~/macs.mn
# .env — see below
npm ci
npm run build
pm2 start npm --name macs_mn -- start -- -p 3030
pm2 save
```

`.env`:
```
SITE_URL=https://macs.mn
DOCS_API_URL=http://127.0.0.1:3004
SITE_API_KEY=<same value as SITE_API_KEY in ~/macs_documents/.env>
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=<openssl rand -base64 32>
```
- `DOCS_API_URL` reaches the docs app directly on this machine, skipping nginx and TLS.
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` must stay the same across builds, otherwise forms open during a deploy fail.

## nginx + TLS (needs sudo)

```bash
sudo cp ~/macs.mn/deploy/nginx-macs.mn.conf /etc/nginx/sites-available/macs.mn
sudo ln -s /etc/nginx/sites-available/macs.mn /etc/nginx/sites-enabled/macs.mn
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d macs.mn -d www.macs.mn
```
The nginx config overwrites `X-Forwarded-For` with the client address; the docs API rate-limits per IP on it.

## Redeploys

```bash
export PATH=$HOME/.nvm/versions/node/v22.21.1/bin:$PATH
cd ~/macs.mn
git pull
npm ci
npm run build
pm2 restart macs_mn --update-env
```

## Checking the forms

If a form shows "Түр алдаа гарлаа…", macs.mn couldn't reach the docs API. `pm2 logs macs_mn` shows `[inquiry] …` with the reason: missing `SITE_API_KEY`, a 401 (keys differ), or the docs app being down.
