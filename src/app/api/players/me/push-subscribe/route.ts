import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';

export const dynamic = 'force-dynamic';

// Persist a Web Push subscription against the calling player. The subscription
// is whatever pushManager.subscribe() handed back on the client (endpoint,
// keys.p256dh, keys.auth, expirationTime). We store it as jsonb so we can
// hand it straight to the `web-push` library on the server later.
export async function POST(req: Request) {
  const body = (await req.json()) as { session_token?: string; subscription?: unknown };
  if (!body.session_token) return NextResponse.json({ error: 'missing token' }, { status: 400 });
  if (!body.subscription) return NextResponse.json({ error: 'missing subscription' }, { status: 400 });
  const player = await dataSource.getPlayerByToken(body.session_token);
  if (!player) return NextResponse.json({ error: 'player not found' }, { status: 404 });
  // Subscribing implies opt-in. Flip the flag too so the host UI counter stays
  // in sync with reality.
  const updated = await dataSource.updatePlayer(player.id, {
    push_subscription: body.subscription,
    notifications_opt_in: true,
  });
  return NextResponse.json({ player: updated });
}
