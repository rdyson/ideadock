# IdeaDock

You know that note in your phone with 40 half-baked startup ideas you'll "look into eventually"? IdeaDock researches them for you on autopilot and tells you which ones are actually worth pursuing.

## What it is

An AI-powered idea research assistant for founders. Submit a raw idea; a research agent runs autonomously in the background and produces a dashboard with a readiness score and per-category breakdown (market size, competitors, trends, customer segments, risks).

## Stack

- Next.js 16 (App Router) + TypeScript
- Postgres via Supabase
- Prisma ORM
- OpenAI or Claude Sonnet 4.6 for the research agent
- Tailwind CSS
- Vercel (deploy target)

## Prerequisites

- Node.js 20+
- A Supabase cloud project
- An [OpenAI API key](https://platform.openai.com/api-keys) or [Anthropic API key](https://console.anthropic.com/)

## Local Development Setup

### 1. Clone and install

```bash
git clone https://github.com/gdiab/ideadock.git
cd ideadock
npm install
```

### 2. Create your `.env.local`

```bash
cp .env.local.example .env.local
```

Fill in the remote Supabase and AI provider values:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT-REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon key from Supabase Project Settings > API>"
AI_PROVIDER="openai"
OPENAI_API_KEY="<your OpenAI API key>"
OPENAI_MODEL="gpt-4o-mini"
# Or use Anthropic instead:
# AI_PROVIDER="anthropic"
# ANTHROPIC_API_KEY="<your Anthropic API key>"
```

Use the Supabase transaction pooler URL for `DATABASE_URL` and the direct database URL for `DIRECT_URL`.

### 3. Apply database migrations

```bash
npx prisma migrate deploy
```

This creates or updates the `Idea` and `ResearchSection` tables in the Supabase Postgres database.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000/signup](http://localhost:3000/signup) to create an account, then submit your first idea.

## Supabase Auth Configuration

In Supabase Dashboard, go to **Authentication > URL Configuration**.

Set **Site URL** to the production app URL:

```
https://your-production-domain.com
```

Add redirect URLs for local development, production, and deploy previews:

```
http://localhost:3000/auth/callback
https://your-production-domain.com/auth/callback
https://*-your-vercel-team.vercel.app/auth/callback
```

The signup flow passes `emailRedirectTo` from the current browser origin. Supabase will only honor that URL if it is listed as an allowed redirect URL; otherwise confirmation emails can fall back to the configured Site URL.

If confirmation emails still point at the wrong host, check **Authentication > Email Templates** and make sure the confirmation template uses Supabase's redirect-aware confirmation URL instead of hardcoding a localhost URL.

## Useful Commands

| Command                     | What it does                                        |
| --------------------------- | --------------------------------------------------- |
| `npm run dev`               | Start Next.js dev server                            |
| `npm run build`             | Production build                                    |
| `npm run db:generate`       | Regenerate Prisma client after schema changes       |
| `npm run db:migrate`        | Create and run a development migration              |
| `npm run db:reset`          | Drop all tables and re-migrate (destructive)        |
| `npm run db:studio`         | Open Prisma Studio (DB browser)                     |
| `npx prisma migrate deploy` | Apply committed migrations to the Supabase database |
