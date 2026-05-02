# PulseBoard

> AI-powered chief-of-staff for busy teams. Built on Google Workspace + Gemini.

PulseBoard reads your calendar, mail, drive, and tasks every morning and tells you what actually matters today — with the reasoning attached. It also exposes a Cmd+K assistant that can answer questions and create tasks on your behalf.

## Stack

- **Next.js 14** (App Router) + **TypeScript** (strict mode)
- **Tailwind CSS** + **Radix UI** for accessible primitives
- **NextAuth** with Google OAuth (offline access, encrypted refresh tokens)
- **Prisma** + **SQLite** (local) / **Postgres** (production)
- **Google APIs**: Calendar, Gmail, Drive, Tasks
- **Gemini** (`gemini-1.5-flash`) for the assistant and brief synthesis
- **Vitest** for unit tests, **Playwright** for E2E

## Prerequisites

You need:
- **Node.js 18.17 or later** (check with `node -v`)
- **npm 9+** (comes with Node)
- A **Google Cloud project** with OAuth credentials
- A **Gemini API key** from Google AI Studio

## Setup (about 10 minutes)

### 1. Install dependencies

```bash
cd pulseboard
npm install
```

This will also generate the Prisma client via the `postinstall` hook.

### 2. Get a Google OAuth client

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create a new project (or pick an existing one).
3. Enable these APIs (each in the API Library):
   - Google Calendar API
   - Gmail API
   - Google Drive API
   - Google Tasks API
4. **Configure OAuth consent screen** → External → fill required fields.
   - Under **Scopes**, add: `calendar.readonly`, `gmail.readonly`, `drive.readonly`, `tasks`.
   - Under **Test users**, add your own Gmail address (the app stays in "Testing" mode for development).
5. **Create credentials** → **OAuth client ID** → **Web application**.
   - **Authorized redirect URI**: `http://localhost:3000/api/auth/callback/google`
   - Copy the **Client ID** and **Client Secret** — you'll need them in step 4.

### 3. Get a Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click **Create API key** and copy it.

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```bash
# Generate these two with: openssl rand -base64 32
NEXTAUTH_SECRET=<paste output>
TOKEN_ENCRYPTION_KEY=<paste output>

NEXTAUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=<from step 2>
GOOGLE_CLIENT_SECRET=<from step 2>

GEMINI_API_KEY=<from step 3>

DATABASE_URL="file:./dev.db"
```

If you don't have `openssl`, any 32+ character random string works. On Windows PowerShell:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 5. Initialize the database

```bash
npx prisma db push
```

This creates `prisma/dev.db` (SQLite) with the schema. You should see "Your database is now in sync with your Prisma schema."

### 6. Run the dev server

```bash
npm run dev
```

Open **http://localhost:3000** — you should see the PulseBoard login screen. Click **Continue with Google**, grant the requested scopes, and you'll land on the Today screen with your live brief.

## What you should see

- **Login screen** — editorial dark theme with the brand mark.
- **Today screen** — your name in the greeting, a one-line "vibe" of the day, and 3–6 cards: priorities, schedule, heads-up items, and suggestions. Each card has a "How I figured this out" toggle that reveals the signals Gemini used.
- **Cmd+K assistant** — bottom-right button or `⌘K` / `Ctrl+K`. Try: *"What's on my calendar today?"* or *"Create a task: review the spec doc by Friday."* The task will appear in your real Google Tasks list.

## Running tests

```bash
npm run test              # unit tests (Vitest)
npm run test:watch        # watch mode
npm run typecheck         # TypeScript check
npm run lint              # ESLint
```

## Common issues

**`Error: Invalid environment configuration`** — One or more env vars are missing or too short. The error message tells you which. `NEXTAUTH_SECRET` and `TOKEN_ENCRYPTION_KEY` must be at least 16 characters.

**`redirect_uri_mismatch` after Google login** — The redirect URI in your OAuth client doesn't match. It must be **exactly** `http://localhost:3000/api/auth/callback/google` (no trailing slash, http not https).

**Login works but the brief shows "Reconnect Google"** — Google didn't return a refresh token. This happens if you've authorized this app before and Google didn't re-prompt. Fix: revoke access at [myaccount.google.com/permissions](https://myaccount.google.com/permissions) and sign in again. The app already requests `prompt=consent` to make this rare.

**Brief shows the fallback ("Auto-generated from raw signals")** — Gemini call failed. Check the dev server logs. Common causes: invalid `GEMINI_API_KEY`, region restriction, or quota exceeded.

**Empty brief / no calendar events** — Make sure your Google account actually has events today, important unread email, or open Google Tasks. With no signals, the brief correctly tells you "nothing is on fire."

**`prisma: command not found`** — Use `npx prisma db push` (with `npx`).

## Project layout

```
app/                        Next.js App Router
  api/
    auth/[...nextauth]/     NextAuth handler
    brief/                  Daily brief endpoint
    assistant/              Cmd+K assistant endpoint
  login/                    Sign-in page
  today/                    Today screen (auth-gated)
  page.tsx                  Root → redirects to /today or /login

components/
  features/                 Domain components (BriefCard, AssistantDialog, …)
  session-provider.tsx

lib/
  auth.ts                   NextAuth config + Google scopes
  crypto.ts                 AES-256-GCM for refresh-token storage
  env.ts                    Zod-validated env vars
  rate-limit.ts             Per-user in-memory limiter
  utils.ts                  cn() Tailwind merge helper
  db/prisma.ts              Prisma singleton
  google/                   One file per Google service
    client.ts, calendar.ts, gmail.ts, drive.ts, tasks.ts
  assistant/
    gemini.ts               Gemini client + system prompt
    brief.ts                Daily brief generator (Gemini + fallback)
    chat.ts                 Multi-turn chat with tool calling
    tools/registry.ts       Sandboxed tool registry

prisma/
  schema.prisma             User, Task, BriefEntry, AssistantInteraction, AuditLog

tests/
  setup.ts
  unit/                     crypto, calendar tests
```

## Security notes

- Refresh tokens are **encrypted at rest** with AES-256-GCM. The encryption key is derived from `TOKEN_ENCRYPTION_KEY` via SHA-256.
- Access tokens are **never persisted** — they're held in the JWT only and refreshed on demand.
- Google API calls are **server-side only**. The browser never sees Google credentials.
- The assistant has access to the database **only through the tool registry** in `lib/assistant/tools/registry.ts`. Every tool input is Zod-validated.
- Every assistant action that mutates state (currently just `create_task`) writes an `AuditLog` row.
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, HSTS, …) are set in `next.config.js`.
- Rate limiting on `/api/brief` (30/hour per user) and `/api/assistant` (60/hour per user).

## What's deliberately out of scope (for the prototype)

- Tasks / Team / Meetings screens — described in the spec, next build phase.
- Webhook-based two-way sync with Google Tasks (currently one-way write).
- Production-grade rate limiting (use Redis / Upstash for multi-instance deployments).
- Email body content extraction (we only read metadata for privacy).
- Full E2E test suite — only unit tests for the security-critical paths (crypto, calendar logic).

## Production deployment notes

If deploying to Vercel or similar:

1. Switch `DATABASE_URL` to a Postgres connection string and update `prisma/schema.prisma`'s datasource provider.
2. Add the production redirect URI to your Google OAuth client: `https://your-domain/api/auth/callback/google`.
3. Set `NEXTAUTH_URL` to your production URL.
4. Move `OAuth consent screen` from "Testing" to "In production" (requires app verification if you exceed test-user limits).
5. Replace the in-memory rate limiter with Redis-backed (Upstash works great with Vercel).

## License

Private prototype. Not for distribution.
