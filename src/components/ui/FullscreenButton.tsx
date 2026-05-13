'use client';

import { useEffect, useState } from 'react';

export function FullscreenButton() {
  const [isFs, setIsFs] = useState(false);
  useEffect(() => {
    const onChange = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggle = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    } else {
      await document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <button
      onClick={toggle}
      className="chip hover:bg-white/12 transition"
      aria-label={isFs ? 'יציאה ממסך מלא' : 'מסך מלא'}
      title={isFs ? 'יציאה ממסך מלא' : 'מסך מלא'}
    >
      <span className="text-base leading-none">{isFs ? '⤡' : '⤢'}</span>
      <span className="text-xs">{isFs ? 'יציאה' : 'מסך מלא'}</span>
    </button>
  );
}
