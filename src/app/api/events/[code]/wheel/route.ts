import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';
import { weightedPick } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// Server-authoritative wheel pick — clients cannot influence the chosen game.
export async function POST(req: Request, ctx: { params: { code: string } }) {
  const event = await dataSource.getEventByCode(ctx.params.code);
  if (!event) return NextResponse.json({ error: 'event not found' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { override_game_id?: string };

  const enabled = (await dataSource.listEventGames(event.id)).filter((g) => g.is_enabled);
  if (enabled.length === 0) {
    return NextResponse.json({ error: 'אין משחקים פעילים' }, { status: 400 });
  }

  const selected = body.override_game_id
    ? enabled.find((g) => g.id === body.override_game_id) ?? null
    : weightedPick(enabled);

  if (!selected) return NextResponse.json({ error: 'failed to pick' }, { status: 500 });

  // Mark spinning, then the client animates and we transition to stopped + intro
  await dataSource.updateLiveSession(event.id, {
    stage_state: 'WHEEL_SPINNING',
    wheel_status: 'spinning',
    wheel_selected_game_id: selected.id,
    active_event_game_id: null,
    active_question_id: null,
  });

  return NextResponse.json({ selected });
}

// Confirm the wheel has stopped — transitions to GAME_INTRO.
export async function PATCH(_req: Request, ctx: { params: { code: string } }) {
  const event = await dataSource.getEventByCode(ctx.params.code);
  if (!event) return NextResponse.json({ error: 'event not found' }, { status: 404 });

  const live = await dataSource.getLiveSession(event.id);
  if (!live?.wheel_selected_game_id) {
    return NextResponse.json({ error: 'no selected game' }, { status: 400 });
  }
  const updated = await dataSource.updateLiveSession(event.id, {
    stage_state: 'GAME_INTRO',
    wheel_status: 'stopped',
    active_event_game_id: live.wheel_selected_game_id,
  });
  return NextResponse.json({ liveSession: updated });
}
