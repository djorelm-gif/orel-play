import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';
import { moderateWithAI } from '@/lib/moderation/ai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, ctx: { params: { code: string } }) {
  const event = await dataSource.getEventByCode(ctx.params.code);
  if (!event) return NextResponse.json({ error: 'event not found' }, { status: 404 });

  const body = (await req.json()) as {
    session_token?: string;
    display_name?: string;
    message?: string;
    photo_url?: string;
  };
  const message = (body.message ?? '').trim();
  const display_name = (body.display_name ?? '').trim();

  if (!message || message.length < 2) {
    return NextResponse.json({ error: 'ברכה קצרה מדי' }, { status: 400 });
  }
  if (!display_name) {
    return NextResponse.json({ error: 'חסר שם' }, { status: 400 });
  }

  let player = null;
  if (body.session_token) {
    player = await dataSource.getPlayerByToken(body.session_token);
  }

  const moderation = await moderateWithAI(message);

  const greeting = await dataSource.createGreeting({
    event_id: event.id,
    player_id: player?.id ?? null,
    display_name,
    photo_url: body.photo_url ?? player?.photo_url ?? null,
    message: moderation.safeMessage,
    moderation_status: moderation.status === 'approved' ? 'needs_review' : moderation.status,
    // ↑ MVP policy: never auto-show. Heuristic-approved messages still go to host queue.
    moderation_reason: moderation.reason,
  });

  return NextResponse.json({ greeting, moderation });
}
