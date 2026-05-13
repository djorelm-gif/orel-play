import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';

export const dynamic = 'force-dynamic';

// Assign a secret mission to a player. Server picks a random player if not specified.
export async function POST(req: Request, ctx: { params: { code: string } }) {
  const event = await dataSource.getEventByCode(ctx.params.code);
  if (!event) return NextResponse.json({ error: 'event not found' }, { status: 404 });

  const body = (await req.json()) as {
    mission_text: string;
    event_game_id: string;
    target_player_id?: string;
    target_mode?: 'random' | 'manual';
  };
  if (!body.mission_text || !body.event_game_id) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  let targetPlayerId = body.target_player_id ?? null;
  if (!targetPlayerId) {
    const players = await dataSource.listPlayers(event.id);
    const active = players.filter((p) => p.status === 'active');
    if (active.length === 0) return NextResponse.json({ error: 'אין שחקנים פעילים' }, { status: 400 });
    targetPlayerId = active[Math.floor(Math.random() * active.length)].id;
  }

  const mission = await dataSource.createMission({
    event_id: event.id,
    event_game_id: body.event_game_id,
    mission_text: body.mission_text,
    assigned_to_player_id: targetPlayerId,
    assigned_to_team: null,
    status: 'assigned',
    result: null,
    assigned_at: new Date().toISOString(),
  });

  // expose target via live session payload so stage can build suspense
  await dataSource.updateLiveSession(event.id, {
    current_payload: { active_mission_id: mission.id, assigned_to_player_id: targetPlayerId },
  });

  return NextResponse.json({ mission });
}

export async function PATCH(req: Request, ctx: { params: { code: string } }) {
  const event = await dataSource.getEventByCode(ctx.params.code);
  if (!event) return NextResponse.json({ error: 'event not found' }, { status: 404 });
  const body = (await req.json()) as { mission_id: string; status?: 'success' | 'fail'; result?: string };
  if (!body.mission_id) return NextResponse.json({ error: 'missing mission_id' }, { status: 400 });
  const mission = await dataSource.updateMission(body.mission_id, {
    status: body.status,
    result: body.result ?? null,
  });
  return NextResponse.json({ mission });
}
