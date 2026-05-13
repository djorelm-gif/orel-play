'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Polls a fetch URL on an interval and returns the latest JSON.
 * Used as the realtime transport in demo mode and as a fallback even with Supabase.
 */
export function usePolledResource<T>(
  url: string | null,
  options: { intervalMs?: number; initialValue?: T } = {},
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  online: boolean;
  lastUpdated: number | null;
  refresh: () => void;
} {
  const { intervalMs = 1500, initialValue = null } = options;
  const [data, setData] = useState<T | null>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(initialValue ? Date.now() : null);
  const tick = useRef(0);
  const consecutiveFailures = useRef(0);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const fetchOnce = async () => {
      const id = ++tick.current;
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (cancelled || id !== tick.current) return;
        if (!res.ok) {
          setError(`HTTP ${res.status}`);
          consecutiveFailures.current += 1;
          if (consecutiveFailures.current >= 3) setOnline(false);
          return;
        }
        const json = (await res.json()) as T;
        if (cancelled || id !== tick.current) return;
        setData(json);
        setError(null);
        setOnline(true);
        setLastUpdated(Date.now());
        consecutiveFailures.current = 0;
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'fetch failed');
        consecutiveFailures.current += 1;
        if (consecutiveFailures.current >= 3) setOnline(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOnce();
    interval = setInterval(fetchOnce, intervalMs);

    const onVis = () => {
      if (document.visibilityState === 'visible') fetchOnce();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [url, intervalMs]);

  const refresh = () => {
    if (!url) return;
    fetch(url, { cache: 'no-store' })
      .then((r) => r.json())
      .then((json: T) => setData(json))
      .catch(() => {});
  };

  return { data, loading, error, online, lastUpdated, refresh };
}
