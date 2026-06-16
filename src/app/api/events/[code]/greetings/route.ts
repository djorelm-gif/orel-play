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

  // Same size guard as /join — keep inline photos small so the snapshot poll
  // doesn't ship megabytes back to every client every 2.5 seconds.
  const PHOTO_MAX_BYTES = 250_000;
  const candidate = body.photo_url ?? player?.photo_url ?? null;
  const photo_url = candidate && candidate.length <= PHOTO_MAX_BYTES ? candidate : null;

  // Default policy is "needs_review" even when the AI says approved, so the
  // host can sanity-check. When the event has auto_approve_greetings = true
  // the AI's verdict goes straight through — useful for trusted family events
  // where the queue would otherwise become a bottleneck.
  let finalStatus: 'pending' | 'approved' | 'rejected' | 'needs_review' =
    moderation.status === 'approved' ? 'needs_review' : moderation.status;
  if (event.auto_approve_greetings && moderation.status === 'approved') {
    finalStatus = 'approved';
  }

  const greeting = await dataSource.createGreeting({
    event_id: event.id,
    player_id: player?.id ?? null,
    display_name,
    photo_url,
    message: moderation.safeMessage,
    moderation_status: finalStatus,
    moderation_reason: moderation.reason,
  });

  return NextResponse.json({ greeting, moderation });
}
