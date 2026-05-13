'use client';

import { useEffect, useState } from 'react';
import { getAudio } from '@/lib/audio';

export function MuteToggle({ className }: { className?: string }) {
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    const audio = getAudio();
    setMuted(audio.isMuted());
    return audio.subscribe(setMuted);
  }, []);
  return (
    <button
      onClick={() => getAudio().toggleMuted()}
      className={`chip hover:bg-white/12 transition ${className ?? ''}`}
      aria-label={muted ? 'הפעל סאונד' : 'השתק'}
      title={muted ? 'הפעל סאונד' : 'השתק'}
    >
      <span className="text-base leading-none">{muted ? '🔇' : '🔊'}</span>
      <span className="text-xs">{muted ? 'מושתק' : 'סאונד'}</span>
    </button>
  );
}
