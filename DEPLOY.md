# Deployment Guide - Neuro-Diagnostic System v2.2.0

The app is a static, client-side web app. Patient data never leaves the browser. It ships with a small Node.js server (`server.js`, 0 runtime dependencies) that adds security headers, compression, caching and a health check.

## 1. Pre-flight (always run before deploying)

```bash
npm run verify      # pre-deploy checks + 26 tests
```

Requirements: Node.js 18 or later (CI tests Node 20 and 22). No `npm install` is needed.

## 2. Choose a deployment option

### Option A - Docker (recommended)

```bash
docker compose up -d --build
# open http://localhost:8080
```

Or without Compose:

```bash
docker build -t neuro-assessment-system:2.2.0 .
docker run -d --name neuro -p 8080:8080 --restart unless-stopped \
  --read-only --cap-drop ALL --security-opt no-new-privileges:true \
  neuro-assessment-system:2.2.0
```

- The image runs as the non-root `node` user and is about 238 MB (node:22-alpine base).
- It has a built-in `HEALTHCHECK`: `GET /healthz` every 30 s.
- It stops cleanly on `SIGTERM` (`docker stop` finishes in under 1 s).

### Option B - Any Node.js host (VM, Render, Railway, Fly.io, Azure App Service, etc.)

```bash
npm start            # listens on $PORT (default 8080)
```

| Variable       | Default   | Purpose                              |
|----------------|-----------|--------------------------------------|
| `PORT`         | `8080`    | Port to listen on                    |
| `HOST`         | `0.0.0.0` | Interface to bind                    |
| `LOG_REQUESTS` | `true`    | Set to `false` to disable access logs |

To keep it running on a plain Linux VM, use systemd:

```ini
# /etc/systemd/system/neuro-assessment.service
[Unit]
Description=Neuro-Diagnostic System
After=network.target

[Service]
WorkingDirectory=/opt/neuro-assessment-system
ExecStart=/usr/bin/node server.js
Environment=PORT=8080
Restart=always
User=www-data
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now neuro-assessment
```

### Option C - Static hosting (GitHub Pages, Netlify, Cloudflare Pages, S3, nginx)

Publish the `public/` folder as-is. No build step is needed.

Static hosts do not send the security headers that `server.js` adds. If your host supports custom headers, copy them from `SECURITY_HEADERS` in `server.js`. The most important one is the `Content-Security-Policy`.

### Option D - Offline / single machine

Open `public/index.html` directly in Chrome or Edge. Everything works except the service worker, which needs `http(s)://`.

## 3. HTTPS (required for clinical use)

Put the app behind a TLS-terminating reverse proxy or load balancer. Voice input (the microphone) and offline mode only work over HTTPS or on `localhost`.

The server sends `Strict-Transport-Security` automatically when the proxy sets `X-Forwarded-Proto: https`.

Example nginx front end:

```nginx
server {
    listen 443 ssl http2;
    server_name neuro.example.org;
    ssl_certificate     /etc/letsencrypt/live/neuro.example.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/neuro.example.org/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 4. Post-deploy smoke test

```bash
curl -fsS https://YOUR-HOST/healthz        # {"status":"ok","version":"2.2.0",...}
curl -fsSI https://YOUR-HOST/ | grep -i content-security-policy
```

Then in a browser:
1. Register a patient.
2. Open Stroke, then calculate the NIHSS score.
3. Print the report.
4. Check that the form values are still there after printing.

## 5. Releasing an update

1. Bump `version` in `package.json`.
2. Set `CACHE_VERSION` in `public/sw.js` to `neuro-dx-<version>`. `npm run check` fails if these 2 do not match. Without the bump, returning users could keep a cached old version.
3. Add an entry to `CHANGELOG.md`.
4. Run `npm run verify`, then redeploy.

## 6. Compliance checklist (your responsibility)

- [ ] Clinical validation of scoring thresholds signed off by a neurologist
- [ ] Served over HTTPS only
- [ ] Access restricted, for example via SSO, VPN or an IP allow-list, if required by your institution
- [ ] Privacy and data-protection review completed (data stays in the browser, but printed reports contain patient details)
- [ ] Approved by institutional governance before clinical use
