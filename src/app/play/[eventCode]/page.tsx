import { notFound } from 'next/navigation';
import { dataSource } from '@/lib/data-source';
import { PlayerLive } from '@/components/player/PlayerLive';

export const dynamic = 'force-dynamic';

export default async function PlayPage({ params }: { params: { eventCode: string } }) {
  const event = await dataSource.getEventByCode(params.eventCode);
  if (!event) return notFound();

  const [liveSession, players, greetings, eventGames, missions] = await Promise.all([
    dataSource.getLiveSession(event.id),
    dataSource.listPlayers(event.id),
    dataSource.listApprovedGreetings(event.id),
    dataSource.listEventGames(event.id),
    dataSource.listMissions(event.id),
  ]);

  let activeQuestion = null;
  let activeGameAnswers: Awaited<ReturnType<typeof dataSource.listAnswers>> = [];
  if (liveSession?.active_question_id && liveSession?.active_event_game_id) {
    activeQuestion = await dataSource.getQuestion(liveSession.active_question_id);
    activeGameAnswers = await dataSource.listAnswers(liveSession.active_event_game_id, liveSession.active_question_id);
  }

  return (
    <div data-theme={event.event_type} className="contents">
      <PlayerLive
        eventCode={event.event_code}
        initial={{
          event,
          liveSession,
          players,
          approvedGreetings: greetings,
          eventGames,
          activeQuestion,
          activeGameAnswers,
          missions,
        }}
      />
    </div>
  );
}
