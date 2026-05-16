import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';
import { generateQuestionsForEvent, buildQuestionRows } from '@/lib/bat-mitzvah-wizard/generator';
import { isOpenAIConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // OpenAI calls can take ~10-20s on Vercel cold start

// Host regenerates the entire question set from the saved profile. Useful when
// the wizard was completed before AI generation was wired in, or when the
// host doesn't love the current questions and wants a fresh batch.
export async function POST(_req: Request, ctx: { params: { code: string } }) {
  const event = await dataSource.getEventByCode(ctx.params.code);
  if (!event) return NextResponse.json({ error: 'event not found' }, { status: 404 });
  const profile = await dataSource.getProfile(event.id);
  if (!profile || !profile.answers || Object.keys(profile.answers).length === 0) {
    return NextResponse.json(
      { error: 'אין עדיין פרופיל ממולא — בקש מהחוגג/ת לסיים את האשף' },
      { status: 400 },
    );
  }

  const eventGames = await dataSource.listEventGames(event.id);
  const byType = Object.fromEntries(eventGames.map((g) => [g.game_type, g.id]));
  const isFemale = event.event_type !== 'bar_mitzvah';
  const generated = await generateQuestionsForEvent(
    event.child_name,
    isFemale,
    profile.answers as Record<string, string | string[]>,
  );
  const rows = buildQuestionRows(generated, byType as Parameters<typeof buildQuestionRows>[1]);

  const byGameId = new Map<string, typeof rows>();
  rows.forEach((r) => {
    const list = byGameId.get(r.event_game_id) ?? [];
    list.push(r);
    byGameId.set(r.event_game_id, list);
  });
  for (const [eventGameId, gameRows] of byGameId) {
    await dataSource.replaceQuestionsForGame(eventGameId, gameRows);
  }

  return NextResponse.json({
    success: true,
    total: rows.length,
    perGame: Object.fromEntries(
      [...byGameId.entries()].map(([id, list]) => [id, list.length]),
    ),
    usedAI: isOpenAIConfigured,
  });
}
