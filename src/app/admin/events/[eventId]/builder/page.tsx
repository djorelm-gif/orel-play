import { notFound } from 'next/navigation';
import Link from 'next/link';
import { dataSource } from '@/lib/data-source';
import { GameBuilder } from '@/components/admin/GameBuilder';

export const dynamic = 'force-dynamic';

export default async function BuilderRoute({ params }: { params: { eventId: string } }) {
  const event = await dataSource.getEventById(params.eventId);
  if (!event) return notFound();
  const games = await dataSource.listEventGames(event.id);

  return (
    <main className="min-h-screen p-6 stage-vignette">
      <div className="max-w-3xl mx-auto space-y-4">
        <header>
          <Link href={`/admin/events/${event.id}/host`} className="text-muted text-sm hover:text-gold">
            ← חזרה למסך השליטה
          </Link>
          <h1 className="text-3xl font-display font-black gold-shimmer mt-1">בילדר משחקים</h1>
          <div className="text-muted">סמן/י אילו משחקים יופיעו בגלגל ל-{event.child_name}</div>
        </header>
        <div className="panel-strong p-4">
          <GameBuilder eventCode={event.event_code} games={games} />
        </div>
      </div>
    </main>
  );
}
