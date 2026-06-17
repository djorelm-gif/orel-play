'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeApplier } from '@/components/ui/ThemeApplier';
import { requestNotificationPermission, persistNotificationOptIn } from '@/lib/notifications';
import { compressImage } from '@/lib/image';
import { IOSInstallPrompt } from '@/components/ui/IOSInstallPrompt';
import type { OrelEvent } from '@/types/event';
import type { PlayerGender } from '@/types/player';

type Step = 'name' | 'photo' | 'greeting' | 'done';

interface Props {
  event: OrelEvent;
}

const STORAGE_KEY = 'orelplay.session';

export function JoinForm({ event }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<PlayerGender | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [, setPlayerId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // restore prior session for this event
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}.${event.event_code}`);
      if (raw) {
        const data = JSON.parse(raw) as { token: string; playerId: string };
        setSessionToken(data.token);
        setPlayerId(data.playerId);
        // already joined → jump to /play
        router.replace(`/play/${event.event_code}`);
      }
    } catch {
      /* ignore */
    }
  }, [event.event_code, router]);

  async function submitName() {
    setError(null);
    if (name.trim().length < 2) {
      setError('שם קצר מדי (לפחות 2 תווים)');
      return;
    }
    if (!gender) {
      setError('צריך לבחור זכר או נקבה');
      return;
    }
    setStep('photo');
  }

  async function handlePhoto(file: File | null) {
    if (!file) return;
    if (file.size > 15_000_000) {
      setError('התמונה גדולה מדי (עד 15MB)');
      return;
    }
    try {
      // Downscale + re-encode so every admin poll doesn't ship a 3MB selfie
      const dataUrl = await compressImage(file);
      setPhotoDataUrl(dataUrl);
    } catch {
      setError('לא הצלחנו לקרוא את התמונה');
    }
  }

  async function commitJoin(): Promise<{ token: string; playerId: string } | null> {
    setBusy(true);
    setError(null);
    try {
      // TODO production: upload photo blob to Supabase Storage and pass the resulting URL.
      // MVP/demo: store data URL inline. Fine for small payloads.
      const res = await fetch(`/api/events/${event.event_code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: name.trim(),
          photo_url: photoDataUrl ?? undefined,
          gender,
        }),
      });
      const data = (await res.json()) as
        | { player: { id: string }; session_token: string }
        | { error: string };
      if (!res.ok || 'error' in data) {
        setError(('error' in data && data.error) || 'נכשל ההצטרפות');
        return null;
      }
      localStorage.setItem(
        `${STORAGE_KEY}.${event.event_code}`,
        JSON.stringify({ token: data.session_token, playerId: data.player.id }),
      );
      setSessionToken(data.session_token);
      setPlayerId(data.player.id);
      return { token: data.session_token, playerId: data.player.id };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'נכשל ההצטרפות');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function submitGreeting(joined?: { token: string }) {
    setBusy(true);
    setError(null);
    try {
      const token = joined?.token ?? sessionToken;
      const res = await fetch(`/api/events/${event.event_code}/greetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: token,
          display_name: name.trim(),
          message: greeting.trim(),
          photo_url: photoDataUrl ?? undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || 'נכשל לשלוח את הברכה');
        return;
      }
      setStep('done');
      // No auto-redirect — the user will tap a button on the done screen
      // after they answer the notifications prompt.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'נכשל לשלוח את הברכה');
    } finally {
      setBusy(false);
    }
  }

  async function handleNotificationChoice(optIn: boolean) {
    if (optIn) {
      const result = await requestNotificationPermission();
      if (result === 'granted' && sessionToken) {
        await persistNotificationOptIn(sessionToken, true);
      } else if (sessionToken) {
        await persistNotificationOptIn(sessionToken, false);
      }
    } else if (sessionToken) {
      await persistNotificationOptIn(sessionToken, false);
    }
    router.push(`/play/${event.event_code}`);
  }

  async function handleGreetingNext() {
    if (greeting.trim().length < 2) {
      setError('הברכה קצרה מדי');
      return;
    }
    // Commit player first if not yet, then submit greeting
    if (!sessionToken) {
      const joined = await commitJoin();
      if (!joined) return;
      await submitGreeting(joined);
    } else {
      await submitGreeting();
    }
  }

  const progress = useMemo(() => {
    if (step === 'name') return 25;
    if (step === 'photo') return 60;
    if (step === 'greeting') return 90;
    return 100;
  }, [step]);

  return (
    <div className="min-h-screen flex flex-col stage-vignette p-5">
      <ThemeApplier eventType={event.event_type} />
      <header className="flex items-center justify-between">
        <div className="chip">
          <span className="size-2 rounded-full bg-success animate-pulse" />
          <span className="tracking-[0.3em]">שידור חי</span>
        </div>
        <div className="text-sm text-muted">
          קוד: <span className="text-gold font-bold tracking-widest">{event.event_code}</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center py-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-display font-black gold-shimmer">
              נכנסים לחגיגה של {event.child_name}
            </h1>
            <p className="text-muted">3 צעדים קצרים ואת/ה בפנים</p>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mt-3">
              <div
                className="h-full bg-gold-gradient transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'name' && (
              <motion.div
                key="name"
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                className="panel-strong p-6 space-y-4"
              >
                <label className="block">
                  <span className="text-sm text-muted">איך קוראים לך?</span>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-2xl bg-white/8 border border-white/15 px-4 py-4 text-xl text-white"
                    placeholder="לדוגמה: שירה"
                    maxLength={30}
                  />
                </label>
                <div className="block">
                  <span className="text-sm text-muted">מי אתה?</span>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('male')}
                      className={`rounded-2xl py-4 font-bold border transition ${
                        gender === 'male'
                          ? 'bg-gold-gradient text-black border-gold shadow-gold-glow'
                          : 'bg-white/6 border-white/12 text-white hover:bg-white/12'
                      }`}
                    >
                      <div className="text-2xl">👦</div>
                      <div>זכר</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('female')}
                      className={`rounded-2xl py-4 font-bold border transition ${
                        gender === 'female'
                          ? 'bg-gold-gradient text-black border-gold shadow-gold-glow'
                          : 'bg-white/6 border-white/12 text-white hover:bg-white/12'
                      }`}
                    >
                      <div className="text-2xl">👧</div>
                      <div>נקבה</div>
                    </button>
                  </div>
                </div>
                {error && <div className="text-danger text-sm">{error}</div>}
                <button className="btn-gold w-full text-lg py-4" onClick={submitName}>
                  המשך →
                </button>
              </motion.div>
            )}

            {step === 'photo' && (
              <motion.div
                key="photo"
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                className="panel-strong p-6 space-y-4"
              >
                <div className="text-center space-y-1">
                  <div className="text-xl font-bold">תמונה לזיהוי</div>
                  <div className="text-muted text-sm">תופיע ליד הברכה שלך במסך הגדול</div>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div
                    className="size-40 rounded-full overflow-hidden bg-white/8 ring-4 ring-gold/40 shadow-gold-glow flex items-center justify-center"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {photoDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoDataUrl} alt="preview" className="size-full object-cover" />
                    ) : (
                      <div className="text-5xl">📷</div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)}
                  />
                  <button className="btn-gold-outline" onClick={() => fileInputRef.current?.click()}>
                    {photoDataUrl ? 'החלף תמונה' : 'צלם/י סלפי'}
                  </button>
                </div>

                {error && <div className="text-danger text-sm">{error}</div>}
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-ghost" onClick={() => setStep('name')}>
                    ← חזור
                  </button>
                  <button className="btn-gold" onClick={() => setStep('greeting')}>
                    {photoDataUrl ? 'המשך' : 'דלג ←'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'greeting' && (
              <motion.div
                key="greeting"
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                className="panel-strong p-6 space-y-4"
              >
                <label className="block">
                  <span className="text-sm text-muted">ברכה ל{event.child_name}</span>
                  <textarea
                    autoFocus
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    rows={4}
                    maxLength={280}
                    className="mt-1 w-full rounded-2xl bg-white/8 border border-white/15 px-4 py-3 text-lg resize-none"
                    placeholder="כתבו ברכה חמה ומצחיקה..."
                  />
                  <div className="mt-1 text-xs text-muted text-end">{greeting.length}/280</div>
                </label>
                <div className="panel p-3 text-xs text-muted">
                  ⚠ הברכה תעבור אישור של המנחה לפני שתופיע במסך הגדול. בלי לשמות פוגעניים, מספרי טלפון או קישורים.
                </div>
                {error && <div className="text-danger text-sm">{error}</div>}
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-ghost" onClick={() => setStep('photo')}>
                    ← חזור
                  </button>
                  <button className="btn-gold" disabled={busy} onClick={handleGreetingNext}>
                    {busy ? 'שולח...' : 'שלח ברכה ✨'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'done' && (
              <DoneStep
                onChoice={handleNotificationChoice}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Post-join CTA. Detects iOS Safari (where Web Push only fires from an
// installed PWA) and routes those guests to the install instructions
// instead of letting them tap "approve notifications" and silently get
// nothing. Android Chrome and installed-PWA iOS get the standard prompt.
function DoneStep({ onChoice }: { onChoice: (optIn: boolean) => void }) {
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [iosWebSafari, setIosWebSafari] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
    const isSafari = !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIosWebSafari(isIOS && isSafari && !standalone);
  }, []);

  return (
    <>
      <motion.div
        key="done"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 20, mass: 0.7 }}
        className="panel-strong p-8 text-center space-y-5"
      >
        <div className="text-6xl">🎉</div>
        <div className="text-2xl font-display font-black gold-shimmer">הצטרפת למשחק!</div>

        {iosWebSafari ? (
          <>
            <div className="space-y-2 pt-2">
              <div className="text-lg font-bold">📱 משתמש/ת באייפון?</div>
              <div className="text-muted text-sm text-balance">
                כדי לקבל התראות גם כשהמסך כבוי, צריך להתקין את האתר על מסך הבית. לוקח 5
                שניות.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button className="btn-ghost py-3" onClick={() => onChoice(false)}>
                ללא התראות
              </button>
              <button className="btn-gold py-3" onClick={() => setShowIOSPrompt(true)}>
                איך מתקינים? ↗
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2 pt-2">
              <div className="text-lg font-bold">לאשר התראות?</div>
              <div className="text-muted text-sm text-balance">
                כשהמשחק יתחיל או כשתקבל/י משימה סודית — נשלח התראה לטלפון, גם אם המסך כבוי.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button className="btn-ghost py-3" onClick={() => onChoice(false)}>
                לא תודה
              </button>
              <button className="btn-gold py-3" onClick={() => onChoice(true)}>
                אישור התראות ✓
              </button>
            </div>
          </>
        )}
      </motion.div>
      {showIOSPrompt && <IOSInstallPrompt trigger="open" />}
    </>
  );
}
