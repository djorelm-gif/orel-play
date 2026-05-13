'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewEventPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [childName, setChildName] = useState('');
  const [venue, setVenue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, child_name: childName, venue: venue || undefined }),
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
      <div className="w-full max-w-md panel-strong p-8 space-y-6">
        <h1 className="text-3xl font-display font-black gold-shimmer">אירוע חדש</h1>
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm text-muted">שם האירוע</span>
            <input
              autoFocus
              className="mt-1 w-full rounded-2xl bg-white/8 border border-white/15 px-4 py-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="בת המצווה של שירה"
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
