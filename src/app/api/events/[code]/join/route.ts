import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';
import { randomToken } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, ctx: { params: { code: string } }) {
  const event = await dataSource.getEventByCode(ctx.params.code);
  if (!event) return NextResponse.json({ error: 'event not found' }, { status: 404 });

  const body = (await req.json()) as {
    display_name?: string;
    photo_url?: string;
    gender?: 'male' | 'female' | null;
  };
  const display_name = (body.display_name ?? '').trim();
  if (display_name.length < 2 || display_name.length > 30) {
    return NextResponse.json({ error: 'שם לא תקין (2-30 תווים)' }, { status: 400 });
  }
  const gender = body.gender === 'male' || body.gender === 'female' ? body.gender : null;

  // Client compressImage() should keep this under ~80KB. Anything materially
  // bigger means an old client (pre-compression) or a malicious payload — drop
  // the photo rather than poison the snapshot poll for everyone.
  const PHOTO_MAX_BYTES = 250_000;
  const photo_url =
    body.photo_url && body.photo_url.length <= PHOTO_MAX_BYTES ? body.photo_url : undefined;

  const token = randomToken();
  const player = await dataSource.createPlayer({
    event_id: event.id,
    display_name,
    session_token: token,
    photo_url,
    gender,
  });
  return NextResponse.json({ player, session_token: token });
}
