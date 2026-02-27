# OneWord — Say one word.

A social feed where you can only say one word.

## Setup

### 1. Create a Supabase project
- Go to [supabase.com](https://supabase.com) and create a free project
- Copy your project URL and anon key

### 2. Run the schema
- Go to SQL Editor in Supabase dashboard
- Paste and run `supabase-schema.sql`

### 3. Configure env
```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

### 4. Run
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack
- **Next.js 15** (App Router)
- **Supabase** (Auth + Postgres + RLS)
- **Tailwind CSS**
- **TypeScript**

## Features (MVP)
- ✅ Email/password auth
- ✅ Post one word
- ✅ Daily prompts
- ✅ Public feed
- ✅ Reactions (🔥 👀 💀 ❤️ 🤔)
- ✅ Row-level security
