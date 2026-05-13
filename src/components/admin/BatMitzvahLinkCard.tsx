'use client';

import { useState } from 'react';
import type { OrelEvent } from '@/types/event';

export function BatMitzvahLinkCard({ event }: { event: OrelEvent }) {
  const [copied, setCopied] = useState(false);
  if (!event.host_token) return null;

  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/me/${event.host_token}`;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const whatsappText = encodeURIComponent(
    `היי ${event.child_name}! זה הקישור האישי שלך למשחק של האירוע. תכנסי לפני האירוע ותעני על השאלות הקצרות — זה ייצור משחקים מותאמים במיוחד לך 💛\n\n${url}`,
  );

  return (
    <div className="panel-strong p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="chip mb-1">
            <span className="size-2 rounded-full bg-magenta animate-pulse" />
            <span className="tracking-[0.2em]">קישור אישי ל{event.child_name}</span>
          </div>
          <div className="text-sm text-muted">תשלחי לה לפני האירוע · {event.profile_complete ? '✓ סיימה' : 'עוד לא מילאה'}</div>
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
          שלחי בוואטסאפ
        </a>
        <a href={url} target="_blank" rel="noreferrer" className="btn-gold-outline text-sm py-2">
          פתחי כדי לבדוק
        </a>
      </div>
    </div>
  );
}
