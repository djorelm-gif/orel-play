# OREL PLAY

Premium Hebrew RTL live game-show web app for Bat Mitzvah events.

Three live screens — Admin host control, Stage projector, Player mobile (QR-only) — synchronized through Supabase Realtime.

## Quick start

```bash
npm install
cp .env.local.example .env.local   # leave Supabase keys blank to run in demo mode
npm run dev
```

Open three browser windows:

- `http://localhost:3000/admin` — host control
- `http://localhost:3000/stage/DEMO12` — stage projector (open in another tab / cast to TV)
- `http://localhost:3000/join/DEMO12` — what players see when they scan the QR

## Demo mode

If `NEXT_PUBLIC_SUPABASE_URL` is empty the app runs against an in-memory store with a seeded `DEMO12` event and the six MVP games. State syncs across tabs through 1.5 s polling. No persistence — restart the dev server and state resets.

To enable real Supabase:

1. Create a project at supabase.com.
2. Run the SQL in `supabase/migrations/0001_initial_schema.sql`.
3. Run `supabase/seed.sql` (optional, seeds the DEMO event + six games).
4. Fill in `.env.local`.
5. Enable Realtime on `live_sessions`, `players`, `greetings`, `player_answers`, `secret_missions`.

## Architecture

See `docs/` (planning package). High-level:

```
Admin ──┐
         ├──► Supabase live_sessions (single source of truth)
Stage ──┤        ▲
         │        │ realtime
Players ┘        │
```

The six games live in `src/lib/game-engine/games/`. Each exports a `stage`, `player`, and `hostControls` component plus a definition. The screens look up the active game from the registry — no switch statements.

## Routes

| Path | Purpose |
|------|---------|
| `/admin` | Event list + create event |
| `/admin/events/[eventId]/host` | Live host control (main op screen) |
| `/admin/events/[eventId]/builder` | Toggle games, edit questions |
| `/admin/events/[eventId]/moderation` | Approve/reject greetings |
| `/stage/[eventCode]` | Stage projector display |
| `/join/[eventCode]` | Player join (QR landing) |
| `/play/[eventCode]` | Player live game UI |

## Deployment

Vercel-ready. Connect the repo, set env vars, point `games.orel.event` at the project.

## Stack

Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Supabase · `qrcode.react`.
