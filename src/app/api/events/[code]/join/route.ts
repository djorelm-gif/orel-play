import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';
import { randomToken } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, ctx: { params: { code: string } }) {
  const event = await dataSource.getEventByCode(ctx.params.code);
  if (!event) return NextResponse.json({ error: 'event not found' }, { status: 404 });

  const body = (await req.json()) as { display_name?: string; photo_url?: string };
  const display_name = (body.display_name ?? '').trim();
  if (display_name.length < 2 || display_name.length > 30) {
    return NextResponse.json({ error: 'שם לא תקין (2-30 תווים)' }, { status: 400 });
  }

  const token = randomToken();
  const player = await dataSource.createPlayer({
    event_id: event.id,
    display_name,
    session_token: token,
    photo_url: body.photo_url,
  });
  return NextResponse.json({ player, session_token: token });
}
