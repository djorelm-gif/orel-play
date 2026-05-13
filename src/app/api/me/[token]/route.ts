import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';

export const dynamic = 'force-dynamic';

// GET /api/me/[token] → returns the event + existing profile answers
export async function GET(_req: Request, ctx: { params: { token: string } }) {
  const event = await dataSource.getEventByHostToken(ctx.params.token);
  if (!event) return NextResponse.json({ error: 'invalid_token' }, { status: 404 });
  const profile = await dataSource.getProfile(event.id);
  return NextResponse.json({
    event: { id: event.id, name: event.name, child_name: event.child_name, event_code: event.event_code },
    profile,
  });
}

// POST /api/me/[token] → save partial or complete answers
//   body: { answers: Record<string, string|string[]>, complete?: boolean }
export async function POST(req: Request, ctx: { params: { token: string } }) {
  const event = await dataSource.getEventByHostToken(ctx.params.token);
  if (!event) return NextResponse.json({ error: 'invalid_token' }, { status: 404 });
  const body = (await req.json()) as { answers: Record<string, string | string[]>; complete?: boolean };
  if (!body.answers || typeof body.answers !== 'object') {
    return NextResponse.json({ error: 'answers required' }, { status: 400 });
  }
  const profile = await dataSource.upsertProfile(event.id, body.answers, Boolean(body.complete));

  if (body.complete) {
    // Generate game questions from the answers
    const { generateQuestions, buildQuestionRows } = await import('@/lib/bat-mitzvah-wizard/generator');
    const eventGames = await dataSource.listEventGames(event.id);
    const byType = Object.fromEntries(eventGames.map((g) => [g.game_type, g.id]));
    const generated = generateQuestions(event.child_name, profile.answers);
    const rows = buildQuestionRows(generated, byType as Parameters<typeof buildQuestionRows>[1]);

    // Group by event_game_id and replace
    const byGameId = new Map<string, typeof rows>();
    rows.forEach((r) => {
      const list = byGameId.get(r.event_game_id) ?? [];
      list.push(r);
      byGameId.set(r.event_game_id, list);
    });
    for (const [eventGameId, gameRows] of byGameId) {
      await dataSource.replaceQuestionsForGame(eventGameId, gameRows);
    }
    await dataSource.updateEvent(event.id, { profile_complete: true });
  }

  return NextResponse.json({ profile });
}
