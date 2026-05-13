'use client';

import { usePolledResource } from '@/lib/realtime/hooks';
import { ModerationQueue } from '@/components/moderation/ModerationQueue';
import type { OrelEvent } from '@/types/event';
import type { Greeting } from '@/types/greeting';
import Link from 'next/link';

export function ModerationPage({ event, initial }: { event: OrelEvent; initial: Greeting[] }) {
  const { data, refresh } = usePolledResource<{ greetings: Greeting[] }>(
    `/api/events/${event.event_code}/greetings/list`,
    { initialValue: { greetings: initial }, intervalMs: 1500 },
  );
  const greetings = data?.greetings ?? initial;

  return (
    <main className="min-h-screen p-6 stage-vignette">
      <div className="max-w-3xl mx-auto space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <Link href={`/admin/events/${event.id}/host`} className="text-muted text-sm hover:text-gold">
              ← חזרה למסך השליטה
            </Link>
            <h1 className="text-3xl font-display font-black gold-shimmer mt-1">אישור ברכות</h1>
            <div className="text-muted">{event.name}</div>
          </div>
        </header>
        <div className="panel-strong p-4">
          <ModerationQueue greetings={greetings} onChange={refresh} />
        </div>
      </div>
    </main>
  );
}
