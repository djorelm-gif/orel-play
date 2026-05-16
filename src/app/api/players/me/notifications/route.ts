import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json()) as { session_token?: string; opt_in?: boolean };
  if (!body.session_token) return NextResponse.json({ error: 'missing token' }, { status: 400 });
  const player = await dataSource.getPlayerByToken(body.session_token);
  if (!player) return NextResponse.json({ error: 'player not found' }, { status: 404 });
  const updated = await dataSource.updatePlayer(player.id, {
    notifications_opt_in: Boolean(body.opt_in),
  });
  return NextResponse.json({ player: updated });
}
