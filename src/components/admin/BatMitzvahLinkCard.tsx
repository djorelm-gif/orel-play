'use client';

import { useEffect, useState } from 'react';
import type { OrelEvent } from '@/types/event';

export function BatMitzvahLinkCard({ event }: { event: OrelEvent }) {
  const [copied, setCopied] = useState(false);
  // Origin is browser-only; deferring to useEffect avoids a hydration mismatch
  // (server renders an empty origin, client knows the real one).
  const [origin, setOrigin] = useState('');
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  if (!event.host_token) return null;

  const url = `${origin}/me/${event.host_token}`;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // The wizard wording depends on the child's gender (event_type).
  const isFem = event.event_type === 'bat_mitzvah';
  const whatsappText = encodeURIComponent(
    isFem
      ? `היי ${event.child_name}! זה הקישור האישי שלך למשחק של האירוע. תיכנסי לפני האירוע ותעני על השאלות הקצרות — זה ייצור משחקים מותאמים במיוחד לך 💛\n\n${url}`
      : `היי ${event.child_name}! זה הקישור האישי שלך למשחק של האירוע. תיכנס לפני האירוע ותענה על השאלות הקצרות — זה ייצור משחקים מותאמים במיוחד לך 💙\n\n${url}`,
  );

  const finishedText = isFem
    ? (event.profile_complete ? '✓ סיימה' : 'עוד לא מילאה')
    : (event.profile_complete ? '✓ סיים' : 'עוד לא מילא');

  return (
    <div className="panel-strong p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="chip mb-1">
            <span className="size-2 rounded-full bg-magenta animate-pulse" />
            <span className="tracking-[0.2em]">קישור אישי ל{event.child_name}</span>
          </div>
          <div className="text-sm text-muted">לשלוח לפני האירוע · {finishedText}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate bg-black/40 rounded-lg px-2 py-2 text-xs ltr:font-mono">
          {url || '...'}
        </code>
        <button className="btn-ghost py-2 px-3 text-sm" onClick={copy}>
          {copied ? 'הועתק ✓' : 'העתק'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noreferrer"
          className="btn-gold text-sm py-2"
        >
          שליחה בוואטסאפ
        </a>
        <a href={url} target="_blank" rel="noreferrer" className="btn-gold-outline text-sm py-2">
          פתיחה לבדיקה
        </a>
      </div>
    </div>
  );
}
