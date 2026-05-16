'use client';

import { useEffect, useRef, useState } from 'react';
import type { LiveSession } from '@/types/live-session';

// Self-scaling iframe that always shows the live stage at 1920x1080 fitted into
// the panel. The host pushes its latest liveSession over postMessage on every
// poll, so the embedded stage updates instantly without remounting.
export function StagePreview({ eventCode, liveSession }: { eventCode: string; liveSession?: LiveSession | null }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [scale, setScale] = useState(0.35);

  // Push every fresh liveSession into the iframe — same-origin so postMessage
  // is essentially free and avoids the flash a key-based remount produced.
  useEffect(() => {
    if (!liveSession) return;
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      { type: 'orel:live-session', eventCode, liveSession },
      window.location.origin,
    );
  }, [eventCode, liveSession]);

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
          ref={iframeRef}
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
