import Link from 'next/link';
import { dataSource } from '@/lib/data-source';
import { DEMO_EVENT_CODE } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const events = await dataSource.listEvents();

  return (
    <main className="min-h-screen p-8 stage-vignette">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-end justify-between">
          <div>
            <div className="chip mb-2">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              <span className="tracking-[0.3em]">ADMIN · CONTROL</span>
            </div>
            <h1 className="text-5xl font-display font-black gold-shimmer">פאנל ניהול</h1>
            <p className="text-muted mt-1">בחרו אירוע פעיל או צרו אחד חדש</p>
          </div>
          <Link href="/admin/events/new" className="btn-gold">
            + אירוע חדש
          </Link>
        </header>

        <div className="grid md:grid-cols-2 gap-4">
          {events.length === 0 && (
            <div className="panel-strong p-8 col-span-full text-center text-muted">
              אין אירועים עדיין. <Link href="/admin/events/new" className="text-gold underline">צרו אחד</Link>.
            </div>
          )}
          {events.map((e) => (
            <Link
              key={e.id}
              href={`/admin/events/${e.id}/host`}
              className="panel-strong p-6 block hover:scale-[1.01] transition-transform"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted">{e.venue ?? '—'}</div>
                  <div className="text-2xl font-bold mt-1">{e.name}</div>
                  <div className="text-muted">ילד/ה: {e.child_name}</div>
                </div>
                <div className="text-end">
                  <div className="text-xs text-muted">קוד</div>
                  <div className="tracking-widest text-gold font-bold text-xl">{e.event_code}</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2 text-xs">
                <span className="chip">
                  סטטוס: <span className="text-gold-light">{e.status}</span>
                </span>
                {e.event_code === DEMO_EVENT_CODE && <span className="chip text-magenta">DEMO</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
