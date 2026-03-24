# Deploying OneWord

## Prerequisites
- A Supabase project (free tier works)
- A server with Docker (e.g., Linode Nanode $5/mo)
- A domain pointed to the server
- Caddy (or nginx) for HTTPS reverse proxy

## 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase-schema.sql`
3. Copy your credentials from **Settings → API**:
   - Project URL
   - Anon/public key
   - Service role key (secret)

## 2. Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## 3. Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 4. Docker Build & Deploy

On your server:

```bash
# Clone the repo
git clone https://github.com/sutharsha/oneword-app.git /opt/oneword-app
cd /opt/oneword-app

# Create .env.local with your credentials
cp .env.local.example .env.local
nano .env.local

# Build and run
docker build -t oneword-app .
docker run -d \
  --name oneword-app \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  --env-file .env.local \
  oneword-app
```

## 5. Caddy (HTTPS Reverse Proxy)

Install Caddy: `apt install caddy`

Edit `/etc/caddy/Caddyfile`:

```
yourdomain.com {
    reverse_proxy localhost:3000
}
```

Reload: `systemctl reload caddy`

Caddy auto-provisions HTTPS via Let's Encrypt.

## 6. Updating

```bash
cd /opt/oneword-app
git pull origin main
docker build -t oneword-app .
docker stop oneword-app && docker rm oneword-app
docker run -d \
  --name oneword-app \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  --env-file .env.local \
  oneword-app
```

## Architecture

```
Browser → Caddy (HTTPS) → Docker (Next.js :3000) → Supabase (Postgres + Auth)
```

- **Compute:** Linode Nanode 1GB ($5/mo) — 1 vCPU, 961MB RAM
- **Database:** Supabase free tier — 500MB, 50K MAU
- **Docker image:** ~160MB, idles at ~60MB RAM
- **Next.js:** Standalone output mode (no node_modules in prod)

## Current Production

- **URL:** https://sayoneword.com (primary), https://oneword.sutharsha.com (legacy)
- **Server:** Linode Nanode, Mumbai (ap-west)
- **Caddy config:** Also serves health.sutharsha.com on same box
