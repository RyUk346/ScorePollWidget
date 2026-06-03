# Deploying to a VPS (Caddy + pm2)

This runs **everything on one VPS**: Caddy serves the built frontend over HTTPS, and pm2 keeps the football-data poller running. Assumes Ubuntu 22.04/24.04 and a domain you control.

The project path used below is `/var/www/scorepoll` — change it if you prefer.

---

## 0. Point your domain at the VPS

In your DNS provider, add an **A record** for your domain (or a subworld, e.g. `poll.yourdomain.com`) pointing to the VPS's public IP. Wait for it to resolve (`ping yourdomain.com` should show the VPS IP) before requesting HTTPS.

## 1. Install Node 20, git, and Caddy

```bash
# SSH in as a sudo user, then:
sudo apt update && sudo apt -y upgrade

# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt -y install nodejs git

# Caddy (official repo)
sudo apt -y install debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt -y install caddy

node -v   # expect v20.x
```

## 2. Get the code onto the VPS

```bash
sudo mkdir -p /var/www/scorepoll
sudo chown -R $USER:$USER /var/www/scorepoll
# Option A: git clone <your-repo-url> /var/www/scorepoll
# Option B: from your PC, copy the folder up (excluding node_modules/dist):
#   scp -r D:\HyperGlow\ScorePollWidget user@VPS_IP:/var/www/scorepoll
cd /var/www/scorepoll
```

## 3. Create `.env`

```bash
nano .env
```

```env
# Firebase (same web config you use locally)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Public URL the QR codes should point to — set to your HTTPS domain.
VITE_PUBLIC_URL=https://yourdomain.com

# Poller
FOOTBALL_DATA_TOKEN=your-football-data-token
FOOTBALL_DATA_COMPETITION=WC
POLL_MS=20000
```

`VITE_PUBLIC_URL` **must** be set before you build — Vite bakes it into the bundle, and it's what makes the on-screen QR encode `https://yourdomain.com/vote`. `FOOTBALL_DATA_TOKEN` is not `VITE_`-prefixed, so it stays server-side and is never shipped to browsers.

## 4. Install deps and build the frontend

```bash
npm ci
npm run build      # outputs to ./dist
```

## 5. Configure Caddy

```bash
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile     # replace yourdomain.com with your domain
sudo systemctl reload caddy
```

Caddy will fetch a Let's Encrypt certificate automatically the first time someone hits the domain over HTTPS. Open `https://yourdomain.com` — you should see the poll widget. Because of the SPA fallback, `https://yourdomain.com/vote` works too.

## 6. Run the poller with pm2

```bash
sudo npm i -g pm2
pm2 start deploy/ecosystem.config.cjs
pm2 logs wc-poller          # should print "wrote N fixtures"
pm2 save                    # remember running processes
pm2 startup                 # prints a command — run it to start pm2 on boot
```

## 7. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## Done — verify

- `https://yourdomain.com` shows the rotating widget on the big screen.
- Scanning the on-screen QR with a phone opens `https://yourdomain.com/vote`.
- `pm2 logs wc-poller` shows fixtures being written every 20s.

## Updating after a code change

```bash
cd /var/www/scorepoll
git pull            # or re-copy files
npm ci
npm run build       # rebuild the frontend
pm2 restart wc-poller   # restart the poller (only needed if server/ or .env changed)
```

Caddy keeps serving from `dist/`, so a rebuild is picked up immediately — no Caddy reload needed unless you change the Caddyfile.

## Notes

- **Firebase rules:** before going public, lock `worldcup` to read-only and run the poller with the Firebase **Admin SDK** (service-account key) so the public can't overwrite your fixtures. The dev rules leave it world-writable.
- **One poller only:** run a single poller instance (one VPS). Multiple pollers just duplicate writes and burn your football-data rate limit.
- **systemd alternative:** if you'd rather not use pm2, the poller can run as a systemd service (`ExecStart=/usr/bin/node /var/www/scorepoll/server/poll-worldcup.mjs`, `WorkingDirectory=/var/www/scorepoll`, `Restart=always`).
