import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';

export const dynamic = 'force-dynamic';

// Player updates their own photo from the play screen (no need to re-join).
// Same size guard as /join — anything over 250 KB is rejected so the
// snapshot poll doesn't ship megabytes back to every client.
const PHOTO_MAX_BYTES = 250_000;

export async function POST(req: Request) {
  const body = (await req.json()) as { session_token?: string; photo_url?: string };
  if (!body.session_token) return NextResponse.json({ error: 'missing token' }, { status: 400 });
  const player = await dataSource.getPlayerByToken(body.session_token);
  if (!player) return NextResponse.json({ error: 'player not found' }, { status: 404 });
  if (!body.photo_url) return NextResponse.json({ error: 'missing photo' }, { status: 400 });
  if (body.photo_url.length > PHOTO_MAX_BYTES) {
    return NextResponse.json({ error: 'התמונה גדולה מדי — נסה/י תמונה אחרת' }, { status: 413 });
  }
  const updated = await dataSource.updatePlayer(player.id, { photo_url: body.photo_url });
  return NextResponse.json({ player: updated });
}
