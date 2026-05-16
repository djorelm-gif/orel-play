import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';

export const dynamic = 'force-dynamic';

// Player toggles their "I want to be picked for physical games" flag. The host
// random-pick UI draws only from players who have this turned on.
export async function POST(req: Request) {
  const body = (await req.json()) as { session_token?: string; wants?: boolean };
  if (!body.session_token) return NextResponse.json({ error: 'missing token' }, { status: 400 });
  const player = await dataSource.getPlayerByToken(body.session_token);
  if (!player) return NextResponse.json({ error: 'player not found' }, { status: 404 });
  const updated = await dataSource.updatePlayer(player.id, {
    wants_to_participate: Boolean(body.wants),
  });
  return NextResponse.json({ player: updated });
}
