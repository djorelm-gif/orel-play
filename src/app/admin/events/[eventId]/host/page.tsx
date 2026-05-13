import { notFound } from 'next/navigation';
import { dataSource } from '@/lib/data-source';
import { HostScreen } from '@/components/admin/HostScreen';

export const dynamic = 'force-dynamic';

export default async function HostPage({ params }: { params: { eventId: string } }) {
  const event = await dataSource.getEventById(params.eventId);
  if (!event) return notFound();

  const [liveSession, players, greetings, eventGames, missions] = await Promise.all([
    dataSource.getLiveSession(event.id),
    dataSource.listPlayers(event.id),
    dataSource.listGreetings(event.id),
    dataSource.listEventGames(event.id),
    dataSource.listMissions(event.id),
  ]);
  if (!liveSession) return notFound();

  let activeQuestion = null;
  let activeAnswers: Awaited<ReturnType<typeof dataSource.listAnswers>> = [];
  if (liveSession.active_question_id && liveSession.active_event_game_id) {
    activeQuestion = await dataSource.getQuestion(liveSession.active_question_id);
    activeAnswers = await dataSource.listAnswers(liveSession.active_event_game_id, liveSession.active_question_id);
  }

  return (
    <HostScreen
      initial={{
        event,
        liveSession,
        players,
        greetings,
        eventGames,
        activeQuestion,
        activeAnswers,
        missions,
      }}
    />
  );
}
