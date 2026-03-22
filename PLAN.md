# OneWord — Go Viral Plan

_Last updated: 2026-03-22_

## 🏗️ What's Built (Current State)

- **Core loop:** Daily prompt → post one word → reactions → feed
- **Auth:** Email/password signup + login + password reset
- **Social:** Profiles, follow/unfollow, notifications, follower counts
- **Engagement:** Streaks, daily recap, "Word of the Day" crown, same-word connections, popular/weekly/all-time tabs
- **Admin:** Prompt manager + analytics panel
- **Infra:** Docker on Linode ($5 Nanode), Caddy reverse proxy (`oneword.sutharsha.com`), GitHub CI, Supabase (free tier)
- **Stack:** Next.js 15 (App Router), Supabase (Auth + Postgres + RLS), Tailwind CSS, TypeScript

---

## 🚀 Virality Feature Roadmap

### Phase 1 — Critical (Must Have Before Launch)

| # | Feature | Status | Priority | Notes |
|---|---------|--------|----------|-------|
| 1 | **Social auth (Google/Twitter/Apple)** | ❌ Not started | HIGH | Email-only signup kills conversion. One-click Google at minimum. |
| 2 | **Remove dev bypass** | ❌ Not started | HIGH | `[dev: allow repost]` button ships to production. Must remove or gate behind env flag. |
| 3 | **Dynamic OG share images** | 🔧 In progress | HIGH | Share links need visual cards showing the word + prompt. Huge for Twitter/WhatsApp previews. |
| 4 | **Anonymous posting → account capture** | 🔧 In progress | HIGH | Let people play without signing up. Capture account after they're hooked. |
| 5 | **Better share flow + friend comparison** | 🔧 In progress | HIGH | "I said X, what would YOU say?" → personalized invite URL. Platform-specific share text. |
| 6 | **Brandable domain** | ❌ Not started | HIGH | `oneword.sutharsha.com` isn't viral-friendly. Need `oneword.app`, `sayoneword.com`, etc. |

### Phase 2 — High Impact (Virality Mechanics)

| # | Feature | Status | Priority | Notes |
|---|---------|--------|----------|-------|
| 7 | **Streak sharing** | ❌ Not started | MEDIUM | "I'm on a 15-day streak 🔥" shareable card/image. |
| 8 | **Push notifications / email digest** | ❌ Not started | MEDIUM | "Today's prompt is live" — Pavlov your users. |
| 9 | **FOMO timer** | ❌ Not started | MEDIUM | "Prompt expires in 3h 42m" — urgency drives action. |
| 10 | **Daily leaderboard** | ❌ Not started | MEDIUM | Most-reacted words of the day. Screenshots = free marketing. |

### Phase 3 — Nice to Have (Growth & Polish)

| # | Feature | Status | Priority | Notes |
|---|---------|--------|----------|-------|
| 11 | **PWA / installable** | ❌ Not started | LOW | "Add to Home Screen" for mobile retention. |
| 12 | **Prompt submissions** | ❌ Not started | LOW | Let popular users submit prompts. They'll promote "their" day. |
| 13 | **Embeddable widget** | ❌ Not started | LOW | Let bloggers/sites embed today's prompt. Free distribution. |

---

## 🐛 Known Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| Word regex `^[a-zA-Z'\-]+$` excludes non-English | MEDIUM | Blocks i18n / global reach. Needs rethinking if targeting non-English markets. |
| Only 10 seed prompts | HIGH | Need prompt generation strategy — manual curation? AI-assisted? Community-submitted? |
| `next/image` external URLs | LOW | May need `remotePatterns` in next.config.ts for avatar URLs. |
| Dev bypass in production | HIGH | `[dev: allow repost]` visible to all users. |
| No rate limiting on auth | MEDIUM | Could be brute-forced. |

---

## 📐 Architecture Notes

- **Hosting:** Linode Nanode 1GB ($5/mo) — 1 vCPU, 961MB RAM, 25GB disk
- **Database:** Supabase free tier — 500MB DB, 50K MAU, shared compute
- **Domain:** Currently `oneword.sutharsha.com` via Caddy on Linode
- **CI:** GitHub Actions — lint, type-check, test, build on push/PR
- **Docker:** Multi-stage build (builder → runner), standalone Next.js output
- **Containers on Linode:** oneword-app (~60MB RAM), health-api (~18MB RAM)

---

## 🔧 Current Sprint (2026-03-22)

**Goal:** Items 3, 4, 5 — OG images, anonymous play, share flow

### 3. Dynamic OG Share Images
- Generate image at `/api/og/[promptId]` using `@vercel/og` (or `satori`)
- Show: prompt question + word + username + OneWord branding
- Wire into `<meta>` tags on prompt detail and word pages
- Result: Rich preview cards when links shared on Twitter/WhatsApp/iMessage

### 4. Anonymous Posting → Account Capture
- Allow posting without auth (store in localStorage as pending)
- Show modal after post: "Sign up to save your word and keep your streak"
- If they sign up, associate the pending word with their new account
- If they don't, word still shows in feed (attributed to "Anonymous")

### 5. Better Share Flow + Friend Comparison
- New route: `/challenge/[promptId]?from=[username]`
- Shows: "[username] said ____. What's YOUR word?"
- Visitor answers → sees comparison → prompted to sign up
- ShareButton updated with platform-specific text for Twitter, WhatsApp, etc.
- Pre-written share text: "I said '____' to today's prompt on OneWord. What would YOU say?"

---

## 📝 Session Log

- **2026-03-22:** Initial audit complete. Repo moved to `/Users/enp/Projects/oneword-app`. Claude Code + Codex CLI installed. Starting work on items 3, 4, 5.
