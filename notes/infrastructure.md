# OneWord Infrastructure Notes

> Reference doc for everything beyond the codebase — database setup, cron jobs,
> extensions, environment config. If we migrate servers or Supabase projects,
> this is the checklist.

## Supabase Project

- **Project ref:** `enmgmrkdveuxblheujsn`
- **Region:** (check dashboard — Supabase-managed Postgres)
- **Dashboard:** https://supabase.com/dashboard/project/enmgmrkdveuxblheujsn

### Database Extensions

| Extension | Version | Purpose |
|-----------|---------|---------|
| `pg_cron` | 1.6.4 | Scheduled database jobs (IP purge) |

To re-enable after migration:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Scheduled Jobs (pg_cron)

| Job | Schedule | Command | Purpose |
|-----|----------|---------|---------|
| `purge-old-ip-addresses` | `0 3 * * *` (3:00 AM UTC / 8:30 AM IST) | `SELECT purge_old_ip_addresses();` | Nulls out `ip_address` on words older than 30 days (privacy compliance) |

To recreate after migration:
```sql
-- 1. Create the purge function
CREATE OR REPLACE FUNCTION purge_old_ip_addresses()
RETURNS integer AS $$
DECLARE
  purged integer;
BEGIN
  UPDATE words 
  SET ip_address = NULL 
  WHERE ip_address IS NOT NULL 
    AND created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS purged = ROW_COUNT;
  RETURN purged;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Schedule it
SELECT cron.schedule(
  'purge-old-ip-addresses',
  '0 3 * * *',
  $$SELECT purge_old_ip_addresses();$$
);
```

To verify jobs are running:
```sql
-- List scheduled jobs
SELECT jobid, schedule, command, nodename, active FROM cron.job;

-- Check recent runs
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Custom Database Functions

| Function | Purpose | Notes |
|----------|---------|-------|
| `purge_old_ip_addresses()` | Nulls `ip_address` on words > 30 days old | SECURITY DEFINER, called by pg_cron |
| `get_todays_prompt()` | Returns today's active prompt | Used by the feed page |

### Schema: `words` Table

```sql
CREATE TABLE words (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id),
  word         text NOT NULL,
  prompt_id    uuid REFERENCES prompts(id),
  created_at   timestamptz DEFAULT now(),
  -- Geolocation (added Apr 2026)
  ip_address   inet,          -- auto-purged after 30 days
  latitude     double precision,
  longitude    double precision,
  city         text,
  country_code text
);

-- Indexes
CREATE INDEX idx_words_ip_purge ON words (created_at) WHERE ip_address IS NOT NULL;
CREATE INDEX idx_words_geo ON words (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
```

### RLS Policies

The `words` table uses Supabase Row Level Security. The geolocation columns
(`ip_address`, `latitude`, etc.) are set server-side via the `/api/words`
route — they pass through RLS because the insert includes `user_id = auth.uid()`.

**Important:** If RLS policies are recreated, ensure authenticated users can
insert rows with all columns (the API route sets geo columns on insert).

## Server (Linode)

- **IP:** 172.105.50.92 (public) / 100.68.90.79 (Tailscale)
- **Plan:** Nanode 1GB ($5/mo), Mumbai (ap-west)
- **OS:** Ubuntu 24.04
- **SSH:** `ssh linode`

### Docker Container

```bash
docker run -d \
  --name oneword-app \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  --env-file .env.local \
  oneword-app
```

### Environment Variables (`.env.local` on server)

```
NEXT_PUBLIC_SUPABASE_URL=https://enmgmrkdveuxblheujsn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-jwt>
NEXT_PUBLIC_SITE_URL=https://sayoneword.com
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

**Note:** The `--env-file` flag passes env vars at runtime, but Next.js
`NEXT_PUBLIC_*` vars are baked in at build time via `.env.local` in the repo.
The service role key is only needed server-side (API routes).

### Caddy (HTTPS)

Caddy handles TLS termination and reverse proxying:
- `sayoneword.com` → `localhost:3000`
- `oneword.sutharsha.com` → `localhost:3000`
- `health.sutharsha.com` → health-api container

Caddy config: `/etc/caddy/Caddyfile`

### DNS

- **sayoneword.com** — Namecheap domain, NS pointed to Linode (`ns1-ns5.linode.com`)
- **Linode DNS:** A record → 172.105.50.92

## GeoIP (MaxMind GeoLite2)

- **Package:** `geolite2-redist` (npm) — redistributed GeoLite2 database, no MaxMind account needed
- **Reader:** `maxmind` (npm)
- **Database:** GeoLite2-City (downloaded automatically by `geolite2-redist` on first use)
- **Location:** Inside `node_modules` — included in Docker image at build time
- **Update:** Database auto-updates when `geolite2-redist` package is updated. Consider updating monthly.
- **Code:** `src/lib/geoip.ts`

### IP Extraction

The API route (`src/app/api/words/route.ts`) extracts client IP from:
1. `x-forwarded-for` header (first entry) — set by Caddy
2. `x-real-ip` header (fallback)

**Caddy automatically sets `X-Forwarded-For`** — no extra config needed.

## Migration Checklist

If moving to a new Supabase project or server:

### Database
- [ ] Run `supabase-schema.sql` (base schema)
- [ ] Run `supabase/migrations/20260412_add_location_to_words.sql` (geo columns)
- [ ] Enable `pg_cron` extension
- [ ] Create `purge_old_ip_addresses()` function
- [ ] Schedule the cron job (`0 3 * * *`)
- [ ] Verify RLS policies allow geo columns on insert
- [ ] Recreate any other custom functions (check `get_todays_prompt`, etc.)

### Server
- [ ] Clone repo, build Docker image
- [ ] Create `.env.local` with new Supabase credentials
- [ ] Set up Caddy with domain(s)
- [ ] Update DNS to point to new server
- [ ] Verify `x-forwarded-for` header is being set by reverse proxy

### App
- [ ] Update `NEXT_PUBLIC_SITE_URL` to new domain
- [ ] Update Google OAuth redirect URLs in Supabase dashboard
- [ ] Test word submission captures IP + geolocation
- [ ] Test that purge job runs (check `cron.job_run_details`)
