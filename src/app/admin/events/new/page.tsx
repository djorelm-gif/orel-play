'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EventType } from '@/types/event';
import { ThemeApplier } from '@/components/ui/ThemeApplier';

export default function NewEventPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [childName, setChildName] = useState('');
  const [venue, setVenue] = useState('');
  const [eventType, setEventType] = useState<EventType>('bat_mitzvah');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          child_name: childName,
          venue: venue || undefined,
          event_type: eventType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'נכשל ליצור אירוע');
        return;
      }
      router.push(`/admin/events/${data.event.id}/host`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'נכשל ליצור אירוע');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen p-8 stage-vignette flex items-center justify-center">
      <ThemeApplier eventType={eventType} />
      <div className="w-full max-w-md panel-strong p-8 space-y-6">
        <h1 className="text-3xl font-display font-black gold-shimmer">אירוע חדש</h1>

        <div className="space-y-2">
          <span className="text-sm text-muted">סוג האירוע</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setEventType('bat_mitzvah')}
              className={`rounded-2xl px-4 py-4 font-bold border transition ${
                eventType === 'bat_mitzvah'
                  ? 'bg-gold-gradient text-black border-gold shadow-gold-glow'
                  : 'bg-white/6 border-white/12 text-white hover:bg-white/12'
              }`}
            >
              <div className="text-2xl">💜</div>
              <div className="text-base">בת מצווה</div>
              <div className="text-xs opacity-70">סגול · זהב · שחור</div>
            </button>
            <button
              type="button"
              onClick={() => setEventType('bar_mitzvah')}
              className={`rounded-2xl px-4 py-4 font-bold border transition ${
                eventType === 'bar_mitzvah'
                  ? 'bg-gold-gradient text-black border-gold shadow-gold-glow'
                  : 'bg-white/6 border-white/12 text-white hover:bg-white/12'
              }`}
            >
              <div className="text-2xl">💙</div>
              <div className="text-base">בר מצווה</div>
              <div className="text-xs opacity-70">כחול · זהב · שחור</div>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="text-sm text-muted">שם האירוע</span>
            <input
              autoFocus
              className="mt-1 w-full rounded-2xl bg-white/8 border border-white/15 px-4 py-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={eventType === 'bat_mitzvah' ? 'בת המצווה של שירה' : 'בר המצווה של איתי'}
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted">שם הילד/ה</span>
            <input
              className="mt-1 w-full rounded-2xl bg-white/8 border border-white/15 px-4 py-3"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="שירה"
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted">מקום (אופציונלי)</span>
            <input
              className="mt-1 w-full rounded-2xl bg-white/8 border border-white/15 px-4 py-3"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="אולמי הזהב"
            />
          </label>
          {error && <div className="text-danger text-sm">{error}</div>}
          <button className="btn-gold w-full" disabled={busy || !name || !childName} onClick={submit}>
            {busy ? 'יוצר...' : 'צור אירוע'}
          </button>
        </div>
      </div>
    </main>
  );
}
