import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';

export const dynamic = 'force-dynamic';

// Single round-trip everything-stage-needs endpoint.
// Used by the polled-realtime hook on stage + player screens.
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

  const approvedGreetings = greetings.filter((g) => g.moderation_status === 'approved');

  let activeQuestion = null;
  if (liveSession?.active_question_id) {
    activeQuestion = await dataSource.getQuestion(liveSession.active_question_id);
  }

  let activeGameAnswers: Awaited<ReturnType<typeof dataSource.listAnswers>> = [];
  if (liveSession?.active_event_game_id && liveSession.active_question_id) {
    activeGameAnswers = await dataSource.listAnswers(
      liveSession.active_event_game_id,
      liveSession.active_question_id,
    );
  }

  return NextResponse.json({
    event,
    liveSession,
    players,
    approvedGreetings,
    eventGames,
    activeQuestion,
    activeGameAnswers,
    missions,
    serverTime: new Date().toISOString(),
  });
}
