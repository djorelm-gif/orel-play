'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  WIZARD_PROMPTS,
  type WizardPrompt,
  type WizardAnswers,
  loc,
  locList,
} from '@/lib/bat-mitzvah-wizard/questions';
import { ThemeApplier } from '@/components/ui/ThemeApplier';
import { Logo } from '@/components/ui/Logo';
import { haptic } from '@/lib/haptics';
import type { EventType } from '@/types/event';

// RTL push/pop: forward (dir=1) slides in from the left, back from the right.
// Declared as variants so framer-motion can type-check the direction-aware
// transition without losing the `custom` param flow.
const pageVariants = {
  enter: (d: 1 | -1) => ({ opacity: 0, x: d === 1 ? -60 : 60 }),
  center: { opacity: 1, x: 0 },
  exit: (d: 1 | -1) => ({ opacity: 0, x: d === 1 ? 60 : -60 }),
};

interface Props {
  token: string;
  childName: string;
  eventType: EventType;
  initialAnswers: WizardAnswers;
  initialIndex?: number;
}

export function Wizard({ token, childName, eventType, initialAnswers, initialIndex = 0 }: Props) {
  const isF = eventType !== 'bar_mitzvah';
  // Autosave can write empty strings as the user clicks through; only a
  // non-empty answer counts as "started" for the intro skip.
  const hasRealAnswers = Object.values(initialAnswers).some((v) =>
    Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim().length > 0,
  );
  const hasStarted = initialIndex > 0 || hasRealAnswers;
  const [showIntro, setShowIntro] = useState(!hasStarted);
  const [idx, setIdx] = useState(initialIndex);
  // dir is +1 when going forward, -1 when going back, so AnimatePresence can
  // slide pages in the natural direction (RTL means "next" comes from the left).
  const [dir, setDir] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<WizardAnswers>(initialAnswers);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const total = WIZARD_PROMPTS.length;
  const prompt = WIZARD_PROMPTS[idx];
  const progress = Math.round(((idx + (done ? 1 : 0)) / total) * 100);

  const isLast = idx >= total - 1;
  const value = answers[prompt?.id ?? ''];

  // autosave every change with a small debounce. Skip empty values so a user
  // who just clicks through doesn't end up with a persisted profile that
  // looks "started" (and would hide the intro on a later return).
  useEffect(() => {
    if (!prompt || showIntro) return;
    const isEmpty = Array.isArray(value)
      ? value.length === 0
      : !value || (typeof value === 'string' && value.trim().length === 0);
    if (isEmpty) return;
    const id = setTimeout(() => {
      void persist({ [prompt.id]: value ?? '' });
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  async function persist(patch: WizardAnswers, complete = false) {
    setError(null);
    try {
      const res = await fetch(`/api/me/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: patch, complete }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `HTTP ${res.status}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'נכשלה שמירה');
    }
  }

  function handleChange(v: string | string[]) {
    setAnswers((a) => ({ ...a, [prompt.id]: v }));
  }

  async function next() {
    if (prompt.required && !hasValue(value)) {
      haptic('warn');
      setError('שדה חובה. תשובה קצרה זה מספיק :)');
      return;
    }
    if (isLast) {
      haptic('success');
      setBusy(true);
      await persist({ ...answers, [prompt.id]: value ?? '' }, true);
      setBusy(false);
      setDone(true);
      return;
    }
    haptic('light');
    setDir(1);
    setIdx((i) => i + 1);
  }

  function back() {
    if (idx > 0) {
      haptic('light');
      setDir(-1);
      setIdx((i) => i - 1);
    }
  }

  if (done) {
    return (
      <>
        <ThemeApplier eventType={eventType} />
        <DoneScreen childName={childName} eventType={eventType} />
      </>
    );
  }

  if (showIntro) {
    return (
      <>
        <ThemeApplier eventType={eventType} />
        <IntroScreen
          childName={childName}
          eventType={eventType}
          total={total}
          onStart={() => setShowIntro(false)}
        />
      </>
    );
  }

  const questionText = loc(prompt.question, eventType);
  const helperText = prompt.helper ? loc(prompt.helper, eventType) : '';

  return (
    <div className="min-h-screen stage-vignette p-5 flex flex-col">
      <ThemeApplier eventType={eventType} />
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div className="chip">
            <span className="size-2 rounded-full bg-gold animate-pulse" />
            <span className="tracking-[0.3em]">{isF ? 'הכל עלייך' : 'הכל עליך'}</span>
          </div>
        </div>
        <div className="text-sm text-muted">
          שאלה {idx + 1} מתוך {total}
        </div>
      </header>

      <div className="mt-4 h-1.5 rounded-full bg-white/8 overflow-hidden">
        <motion.div
          className="h-full bg-gold-gradient shadow-[0_0_12px_rgba(255,231,163,0.6)]"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center py-8 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={prompt.id}
            custom={dir}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 340, damping: 30, mass: 0.7 }}
            className="w-full max-w-xl panel-3d p-7 space-y-5"
          >
            <div className="text-5xl drop-shadow-[0_6px_16px_rgba(216,168,78,0.35)]">{prompt.emoji}</div>
            <h2 className="text-3xl font-editorial font-black text-balance leading-snug">
              {questionText}
            </h2>
            {helperText && <p className="text-muted text-base">{helperText}</p>}

            <PromptInput prompt={prompt} value={value} onChange={handleChange} eventType={eventType} />

            {error && <div className="text-danger text-sm">{error}</div>}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button className="btn-ghost" onClick={back} disabled={idx === 0 || busy}>
                ← חזרה
              </button>
              <button className="btn-gold" onClick={next} disabled={busy}>
                {busy ? 'שומר...' : isLast ? 'סיימתי ✨' : 'הבא →'}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="text-center text-xs text-muted">
        {isF
          ? 'כל התשובות נשמרות באוטומטי. תוכלי לחזור לקישור הזה ולהשלים בהמשך.'
          : 'כל התשובות נשמרות באוטומטי. תוכל לחזור לקישור הזה ולהשלים בהמשך.'}
      </div>
    </div>
  );
}

function IntroScreen({
  childName,
  eventType,
  total,
  onStart,
}: {
  childName: string;
  eventType: EventType;
  total: number;
  onStart: () => void;
}) {
  const isF = eventType !== 'bar_mitzvah';
  // iOS app-launch staggered entry:
  //   1) logo zooms from blur (180ms)
  //   2) sparkle emoji pops with overshoot (+100ms)
  //   3) "היי X" headline springs in (+100ms)
  //   4) body text fades up (+100ms)
  //   5) CTA fades up (+100ms)
  return (
    <div className="min-h-screen stage-vignette flex items-center justify-center p-5">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="panel-3d p-8 md:p-10 max-w-xl w-full text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, filter: 'blur(12px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          className="flex justify-center"
        >
          <Logo size="md" />
        </motion.div>

        <motion.div
          initial={{ scale: 0, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 14, delay: 0.18 }}
          className="text-7xl select-none drop-shadow-[0_8px_20px_rgba(216,168,78,0.45)]"
        >
          ✨
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22, delay: 0.32 }}
          className="text-4xl md:text-5xl font-editorial font-black gold-shimmer leading-tight"
        >
          היי {childName}!
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.45 }}
          className="space-y-4"
        >
          <p className="text-xl text-balance leading-relaxed">
            {isF
              ? 'האירוע שלך כבר ממש קרוב — ובאנו לעשות אותו הכי ממך שאפשר.'
              : 'האירוע שלך כבר ממש קרוב — ובאנו לעשות אותו הכי ממך שאפשר.'}
          </p>

          <div className="space-y-3 text-muted text-base text-balance leading-relaxed">
            <p>
              {isF
                ? `${total} שאלות קצרות עלייך — האוכל שאת אוהבת, החברות שלך, הרגלים מצחיקים, חלומות.`
                : `${total} שאלות קצרות עליך — האוכל שאתה אוהב, החברים שלך, הרגלים מצחיקים, חלומות.`}
            </p>
            <p>
              {isF
                ? 'מהתשובות נבנה שעשועון אישי לאירוע שלך — האורחים יענו עלייך, יצחקו ויתרגשו.'
                : 'מהתשובות נבנה שעשועון אישי לאירוע שלך — האורחים יענו עליך, יצחקו ויתרגשו.'}
            </p>
            <p className="text-sm">
              {isF
                ? 'אין תשובות נכונות. תהיי כנה ופשוט תהיי את. הכל נשמר אוטומטית.'
                : 'אין תשובות נכונות. תהיה כן ופשוט תהיה אתה. הכל נשמר אוטומטית.'}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.58 }}
          className="space-y-2"
        >
          <button className="btn-gold w-full text-lg py-4" onClick={onStart}>
            יאללה, מתחילים ✨
          </button>
          <p className="text-xs text-muted">לוקח 3-5 דקות · אפשר לעצור ולחזור</p>
        </motion.div>
      </motion.div>
    </div>
  );
}

function PromptInput({
  prompt,
  value,
  onChange,
  eventType,
}: {
  prompt: WizardPrompt;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
  eventType: EventType;
}) {
  const strValue = useMemo(() => (Array.isArray(value) ? value.join(', ') : (value ?? '')), [value]);
  const placeholder = prompt.placeholder ? loc(prompt.placeholder, eventType) : undefined;

  if (prompt.inputType === 'short_text') {
    return (
      <input
        autoFocus
        value={strValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={120}
        className="w-full rounded-2xl bg-white/8 border border-white/15 px-4 py-4 text-lg"
      />
    );
  }
  if (prompt.inputType === 'long_text') {
    return (
      <textarea
        autoFocus
        value={strValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={280}
        className="w-full rounded-2xl bg-white/8 border border-white/15 px-4 py-3 text-lg resize-none"
      />
    );
  }
  if (prompt.inputType === 'list') {
    return (
      <ListInput
        prompt={prompt}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
    );
  }
  if (prompt.inputType === 'choice' || prompt.inputType === 'multi_choice') {
    const selected = Array.isArray(value) ? value : value ? [value] : [];
    const options = locList(prompt.options, eventType);
    return (
      <div className="grid gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                if (prompt.inputType === 'multi_choice') {
                  const next = active ? selected.filter((s) => s !== opt) : [...selected, opt];
                  onChange(next);
                } else {
                  onChange(opt);
                }
              }}
              className={`w-full text-start rounded-2xl px-4 py-4 text-lg font-bold border transition ${
                active
                  ? 'bg-gold-gradient text-black border-gold shadow-gold-glow'
                  : 'bg-white/6 border-white/12 hover:bg-white/12 text-white'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }
  return null;
}

// Comma-separated list input. The old version split + filtered on every
// keystroke, so the moment the user typed "," the empty trailing token was
// filtered out and the user couldn't type "comma + space" between items.
// We now store the value as a raw string in parent state and rely on
// getList() at read time to parse it — no normalization while the user types.
function ListInput({
  prompt,
  value,
  placeholder,
  onChange,
}: {
  prompt: WizardPrompt;
  value: string | string[] | undefined;
  placeholder: string | undefined;
  onChange: (v: string | string[]) => void;
}) {
  const text = Array.isArray(value) ? value.join(', ') : (value ?? '');
  const maxItems = prompt.maxItems ?? 5;
  return (
    <div className="space-y-2">
      <input
        autoFocus
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl bg-white/8 border border-white/15 px-4 py-4 text-lg"
      />
      <div className="text-xs text-muted">מפרידים בפסיק. עד {maxItems} פריטים.</div>
    </div>
  );
}

function DoneScreen({ childName, eventType }: { childName: string; eventType: EventType }) {
  const isF = eventType !== 'bar_mitzvah';
  return (
    <div className="min-h-screen stage-vignette flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="panel-3d p-10 max-w-md text-center space-y-4"
      >
        <motion.div
          initial={{ scale: 0, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.18 }}
          className="text-7xl drop-shadow-[0_8px_24px_rgba(216,168,78,0.5)]"
        >
          ✨
        </motion.div>
        <h1 className="text-4xl font-editorial font-black gold-shimmer">סיימנו!</h1>
        <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent opacity-80" />
        <p className="text-muted text-lg">
          התשובות נשמרו. עכשיו המערכת תכין שאלות מותאמות אישית לאירוע של {childName}.
        </p>
        <p className="text-muted">המנחה רואה את כל מה שמילאת ויכול לערוך.</p>
        <div className="text-xs text-muted pt-4">
          {isF ? 'תוכלי לסגור את החלון בלב שקט.' : 'תוכל לסגור את החלון בלב שקט.'}
        </div>
      </motion.div>
    </div>
  );
}

function hasValue(v: string | string[] | undefined): boolean {
  if (!v) return false;
  if (Array.isArray(v)) return v.length > 0;
  return v.trim().length > 0;
}
