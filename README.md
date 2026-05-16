# OREL PLAY

Premium Hebrew RTL live game-show web app for Bat / Bar Mitzvah events.

🚀 **Production:** https://games.orel.events  
📦 **Repo:** https://github.com/djorelm-gif/orel-play  
🎨 **Themes:** purple/gold/black for bat mitzvah, royal-blue/gold/black for bar mitzvah

Three live screens — Admin host control, Stage projector, Player mobile (QR-only) — synchronized through Supabase Realtime.

## Quick start (local)

```bash
npm install
cp .env.local.example .env.local   # leave Supabase keys blank to run in demo mode
npm run dev
```

Open three browser windows:

- `http://localhost:3000/admin` — host control
- `http://localhost:3000/stage/DEMO12` — stage projector (open in another tab / cast to TV)
- `http://localhost:3000/join/DEMO12` — what players see when they scan the QR

## Routes

| Path | Purpose |
|------|---------|
| `/admin` | Event list + create event |
| `/admin/events/new` | Create event with bat/bar theme picker |
| `/admin/events/[eventId]/host` | Live host control (main op screen) |
| `/admin/events/[eventId]/builder` | Toggle games, edit questions |
| `/admin/events/[eventId]/moderation` | Approve/reject greetings |
| `/stage/[eventCode]` | Stage projector display |
| `/join/[eventCode]` | Player join (QR landing) |
| `/play/[eventCode]` | Player live game UI |
| `/me/[host_token]` | Bat/Bar mitzvah personalization wizard (19 questions → personalized game questions) |

## Theme system

`event_type` on each event is either `bat_mitzvah` or `bar_mitzvah`. The `ThemeApplier` client component sets `data-theme` on `<html>`, and CSS variables in `globals.css` swap palettes:

```css
[data-theme='bat_mitzvah'] { --accent-rgb: 216 45 255; --accent-2-rgb: 123 44 255; }
[data-theme='bar_mitzvah'] { --accent-rgb: 45 79 255;  --accent-2-rgb: 79 184 255;  }
```

Tailwind tokens `magenta` and `purple-neon` resolve to those vars, so every existing component auto-adapts — no per-component changes.

## Demo mode

If `NEXT_PUBLIC_SUPABASE_URL` is empty the app runs against an in-memory store with a seeded `DEMO12` event. State syncs across tabs through 1.5 s polling. No persistence — restart the dev server and state resets.

## Production Supabase

Tables live in the `PHOTOBOX` Supabase project with the `op_` prefix (`op_events`, `op_players`, etc) to coexist with PHOTOBOX's own tables. Schema in `supabase/migrations/`. Triggers auto-seed `host_token` + 6 event_games + live_session on every new event row.

To set up a fresh project:

1. Create a project at supabase.com.
2. Run the SQL in `supabase/migrations/0001_initial_schema.sql` then `0002_event_seed_trigger.sql`.
3. Fill in `.env.local`.
4. Enable Realtime on `op_live_sessions`, `op_players`, `op_greetings`, `op_player_answers`, `op_secret_missions`.

## Architecture

```
Admin ──┐
        ├──► Supabase op_live_sessions (single source of truth)
Stage ──┤        ▲
        │        │ realtime + 1.5s polling fallback
Players ┘
```

The six games live in `src/lib/game-engine/games/`. Each exports `stage`, `player`, and `hostControls` components plus a definition. Screens look up the active game from the registry — no switch statements.

## Deployment & access

| Service | Account | Owner | What it can do |
|---------|---------|-------|----------------|
| Vercel | djorelm-gif | OREL PLAY project | Auto-deploys on every push to `master` via GitHub integration |
| GitHub | djorelm-gif | `orel-play` repo (public) | Hosts code; preview deploys on PR |
| Supabase | `Orel` org, `PHOTOBOX` project | `op_*` tables | Data + Realtime |
| Namecheap | djorelm | `orel.events` | CNAME `games` → `cname.vercel-dns.com` |

### Revoking automated access

If you ever want to remove CLI access:

```bash
gh auth logout                       # GitHub CLI
vercel logout                        # Vercel CLI
```

And in the dashboards:
- GitHub: [Settings → Applications](https://github.com/settings/applications) → revoke "GitHub CLI"
- Vercel: [Account Settings → Tokens](https://vercel.com/account/tokens) → delete any CLI tokens

## Sounds (optional)

The audio manager (`src/lib/audio/index.ts`) expects 9 files in `public/sounds/`. The app runs gracefully without them.

| File | When it plays | Vibe |
|------|---------------|------|
| `wheel-spin.mp3` | Wheel rotation | Looping ticking + whoosh, ~4-6s |
| `wheel-stop.mp3` | Wheel lands | Sharp THUNK + ding, ~0.5s |
| `reveal.mp3` | GAME_INTRO | Dramatic sting, ~1.5s |
| `correct.mp3` | Player got it right | Positive ding, ~0.7s |
| `wrong.mp3` | Player got it wrong | Soft buzz, ~0.5s |
| `confetti.mp3` | Results / win / final | Pop + cheer, ~2s |
| `mission.mp3` | Secret mission assigned | Spy-cue, ~1s |
| `tick.mp3` | Countdown | Single tick, 0.2s |
| `background-loop.mp3` | JOIN_SCREEN ambience | Quiet luxury loop, 30s+ |

## Stack

Next.js 14 App Router · TypeScript · Tailwind · Framer Motion · Supabase · `qrcode.react`
