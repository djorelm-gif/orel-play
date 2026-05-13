import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';

export const dynamic = 'force-dynamic';

// Same as snapshot but also includes pending greetings for moderation.
export async function GET(_req: Request, ctx: { params: { code: string } }) {
  const event = await dataSource.getEventByCode(ctx.params.code);
  if (!event) return NextResponse.json({ error: 'event not found' }, { status: 404 });

  const [liveSession, players, greetings, eventGames, missions] = await Promise.all([
    dataSource.getLiveSession(event.id),
    dataSource.listPlayers(event.id),
    dataSource.listGreetings(event.id),
    dataSource.listEventGames(event.id),
    dataSource.listMissions(event.id),
  ]);

  let activeQuestion = null;
  let activeAnswers: Awaited<ReturnType<typeof dataSource.listAnswers>> = [];
  if (liveSession?.active_question_id && liveSession?.active_event_game_id) {
    activeQuestion = await dataSource.getQuestion(liveSession.active_question_id);
    activeAnswers = await dataSource.listAnswers(
      liveSession.active_event_game_id,
      liveSession.active_question_id,
    );
  }

  return NextResponse.json({
    event,
    liveSession,
    players,
    greetings,
    eventGames,
    missions,
    activeQuestion,
    activeAnswers,
  });
}
