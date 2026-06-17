'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'orelplay.iosInstallDismissed';
const RESHOW_AFTER_DAYS = 7;

// Detects iOS Safari (NOT iOS Chrome, NOT in-app webviews, NOT already
// installed as a PWA) and shows a step-by-step "Add to Home Screen" sheet.
// Required because Apple only delivers Web Push notifications when the site
// is installed to the home screen — there's no way around it.
//
// Dismissable; the choice persists in localStorage so we don't nag.
export function IOSInstallPrompt({ trigger = 'auto' }: { trigger?: 'auto' | 'open' }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Is this iOS Safari, NOT a webview, NOT already installed?
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
    if (!isIOS) return;

    // iOS Chrome / Firefox can't install — only Safari. Detect Safari by the
    // absence of CriOS / FxiOS in the UA.
    const isSafari = !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    if (!isSafari) return;

    // Already running standalone (installed)? Bail.
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    if (trigger === 'open') {
      setShow(true);
      return;
    }

    // Honor the dismissal cooldown.
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const ts = parseInt(raw, 10);
      if (!Number.isNaN(ts) && Date.now() - ts < RESHOW_AFTER_DAYS * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Small delay so the page renders first.
    const t = window.setTimeout(() => setShow(true), 900);
    return () => window.clearTimeout(t);
  }, [trigger]);

  function dismiss() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={dismiss} />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: 60, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="relative w-full max-w-md panel-strong p-6 space-y-5 text-end"
          >
            <div className="flex items-start gap-3">
              <div className="text-5xl select-none">📱</div>
              <div className="flex-1 space-y-1 text-end">
                <div className="text-2xl font-display font-black gold-shimmer leading-tight">
                  להתקין על האייפון
                </div>
                <div className="text-sm text-muted">
                  כדי לקבל התראות גם כשהמסך כבוי, צריך להוסיף את האתר למסך הבית.
                </div>
              </div>
            </div>

            <ol className="space-y-3 text-end" dir="rtl">
              <Step n={1}>
                לחץ/י על כפתור השיתוף בתחתית ה-Safari{' '}
                <ShareIcon />
              </Step>
              <Step n={2}>
                גלול/י ובחר/י <strong className="text-gold-light">״הוספה למסך הבית״</strong>{' '}
                <AddIcon />
              </Step>
              <Step n={3}>
                לחץ/י <strong className="text-gold-light">״הוסף״</strong> בפינה הימנית העליונה
              </Step>
              <Step n={4}>
                פתח/י את האפליקציה <strong className="text-gold-light">״אורל פליי״</strong> מהמסך
                הבית ואשר/י התראות
              </Step>
            </ol>

            <div className="text-xs text-muted text-balance text-center pt-2">
              אנדרואיד? לא צריך להתקין — ההתראות עובדות אוטומטית מהדפדפן.
            </div>

            <div className="flex gap-2">
              <button onClick={dismiss} className="btn-ghost flex-1 text-sm py-3">
                בהמשך
              </button>
              <button
                onClick={dismiss}
                className="btn-gold flex-1 text-sm py-3"
              >
                הבנתי ✓
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start text-end">
      <div
        className="size-7 rounded-full text-black font-display font-black grid place-items-center text-sm shrink-0 mt-0.5"
        style={{
          background:
            'radial-gradient(circle at 35% 25%, #fff7dc 0%, #ffe7a3 30%, #d8a84e 70%, #9c7732 100%)',
          boxShadow:
            '0 0 0 1px rgba(255,231,163,0.55), 0 2px 6px rgba(0,0,0,0.45), inset 0 1px 2px rgba(255,255,255,0.85)',
        }}
      >
        {n}
      </div>
      <div className="flex-1 text-base leading-snug">{children}</div>
    </li>
  );
}

// Apple's share icon ⬆️ in a square — visual match to what users see in Safari.
function ShareIcon() {
  return (
    <span
      className="inline-flex items-center justify-center align-text-bottom rounded-md ms-1"
      style={{
        width: 24,
        height: 24,
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.18)',
        color: '#5ac8fa',
      }}
      aria-hidden
    >
      <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
        <path
          d="M7 1v9M3.5 4.5L7 1l3.5 3.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 8v5a2 2 0 002 2h6a2 2 0 002-2V8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

// Plus-in-square icon — matches the "Add to Home Screen" row.
function AddIcon() {
  return (
    <span
      className="inline-flex items-center justify-center align-text-bottom rounded-md ms-1"
      style={{
        width: 24,
        height: 24,
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.18)',
        color: '#FFE7A3',
      }}
      aria-hidden
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M7 2v10M2 7h10"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
