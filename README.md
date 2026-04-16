# IdeaDock

You know that note in your phone with 40 half-baked startup ideas you'll "look into eventually"? IdeaDock researches them for you on autopilot and tells you which ones are actually worth pursuing.

## What it is

An AI-powered idea research assistant for founders. Submit a raw idea; a research agent runs autonomously in the background and produces a dashboard with a readiness score and per-category breakdown (market size, competitors, trends, customer segments, risks).

## Stack

- Next.js 14 (App Router) + TypeScript
- Postgres via Supabase
- Prisma ORM
- Claude Sonnet 4.6 for the research agent
- Tailwind CSS
- Vercel (deploy target)

## Prerequisites

- Node.js 18+
- Docker Desktop (for local Supabase)
- Supabase CLI (`brew install supabase/tap/supabase`)
- An [Anthropic API key](https://console.anthropic.com/)

## Local Development Setup

### 1. Clone and install

```bash
git clone https://github.com/gdiab/ideadock.git
cd ideadock
npm install
```

### 2. Start local Supabase

```bash
supabase start
```

First run pulls Docker images (~5 min). Subsequent starts take ~30s.

When it finishes, it prints your local credentials:

```
API URL: http://127.0.0.1:54321
anon key: eyJ...
service_role key: eyJ...
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
Inbucket URL: http://127.0.0.1:54324
```

### 3. Create your `.env.local`

```bash
cp .env.local.example .env.local
```

Fill in using the values from `supabase start`:

```
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon key from above>"
ANTHROPIC_API_KEY="<your Anthropic API key>"
```

### 4. Run database migrations

```bash
npm run db:migrate
```

This creates the `Idea` and `ResearchSection` tables in your local Postgres.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000/signup](http://localhost:3000/signup) to create an account, then submit your first idea.

### 6. Check email confirmations

Supabase auth sends confirmation emails locally via Inbucket: [http://localhost:54324](http://localhost:54324)

## Useful Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:migrate` | Create and run a new migration |
| `npm run db:reset` | Drop all tables and re-migrate (destructive) |
| `npm run db:studio` | Open Prisma Studio (DB browser) |
| `supabase start` | Start local Supabase stack |
| `supabase stop` | Stop local Supabase stack |
| `supabase db reset` | Reset local Supabase DB |

## Connecting to Remote Supabase (Dev/Staging)

To point at the cloud Supabase project instead of local:

1. Get credentials from Supabase Dashboard → Project Settings
2. Update `.env.local` with the remote values (see `.env.local.example` for the format)
3. Run `npm run db:migrate` to apply migrations to the remote DB
4. Apply RLS policy in the Supabase SQL Editor:

```sql
ALTER TABLE "Idea" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own ideas"
  ON "Idea" FOR ALL
  USING (auth.uid()::text = "userId");
```
