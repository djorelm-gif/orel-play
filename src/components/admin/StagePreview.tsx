'use client';

import { useEffect, useRef, useState } from 'react';

// Self-scaling iframe that always shows the live stage at 1920x1080 fitted into the panel.
//
// `liveStageKey` is a cache-buster that the host passes in (typically the current
// stage_state + the live-session updated_at). When the host clicks to change the
// stage, the parent re-renders with a new key and the iframe reloads — guaranteeing
// the preview matches the live screen even if the iframe's internal polling lagged.
export function StagePreview({ eventCode, liveStageKey }: { eventCode: string; liveStageKey?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.35);

  useEffect(() => {
    function recompute() {
      if (!containerRef.current) return;
      const { width } = containerRef.current.getBoundingClientRect();
      setScale(width / 1920);
    }
    recompute();
    const ro = new ResizeObserver(recompute);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const height = 1080 * scale;

  return (
    <div className="panel-strong p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="chip">
          <span className="size-2 rounded-full bg-magenta animate-pulse" />
          <span className="tracking-[0.2em]">מה שמוקרן עכשיו</span>
        </div>
        <a
          href={`/stage/${eventCode}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-gold-light hover:underline"
        >
          פתח במסך מלא ↗
        </a>
      </div>
      <div ref={containerRef} className="relative w-full rounded-2xl overflow-hidden bg-black border border-white/10" style={{ height }}>
        <iframe
          key={liveStageKey ?? 'preview'}
          src={`/stage/${eventCode}`}
          title="Stage preview"
          className="origin-top-right border-0"
          style={{
            transform: `scale(${scale})`,
            width: 1920,
            height: 1080,
            position: 'absolute',
            inset: 0,
          }}
        />
      </div>
    </div>
  );
}
