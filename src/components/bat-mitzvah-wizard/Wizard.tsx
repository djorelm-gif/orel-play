'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WIZARD_PROMPTS, type WizardPrompt, type WizardAnswers } from '@/lib/bat-mitzvah-wizard/questions';

interface Props {
  token: string;
  childName: string;
  initialAnswers: WizardAnswers;
  initialIndex?: number;
}

export function Wizard({ token, childName, initialAnswers, initialIndex = 0 }: Props) {
  const [idx, setIdx] = useState(initialIndex);
  const [answers, setAnswers] = useState<WizardAnswers>(initialAnswers);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const total = WIZARD_PROMPTS.length;
  const prompt = WIZARD_PROMPTS[idx];
  const progress = Math.round(((idx + (done ? 1 : 0)) / total) * 100);

  const isLast = idx >= total - 1;
  const value = answers[prompt?.id ?? ''];

  // autosave every change with a small debounce
  useEffect(() => {
    if (!prompt) return;
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
      setError('שדה חובה. תשובה קצרה זה מספיק :)');
      return;
    }
    if (isLast) {
      setBusy(true);
      await persist({ ...answers, [prompt.id]: value ?? '' }, true);
      setBusy(false);
      setDone(true);
      return;
    }
    setIdx((i) => i + 1);
  }

  function back() {
    if (idx > 0) setIdx((i) => i - 1);
  }

  if (done) {
    return <DoneScreen childName={childName} />;
  }

  return (
    <div className="min-h-screen stage-vignette p-5 flex flex-col">
      <header className="flex items-center justify-between">
        <div className="chip">
          <span className="size-2 rounded-full bg-gold animate-pulse" />
          <span className="tracking-[0.3em]">הכל עלייך · OREL PLAY</span>
        </div>
        <div className="text-sm text-muted">
          שאלה {idx + 1} מתוך {total}
        </div>
      </header>

      <div className="mt-4 h-1.5 rounded-full bg-white/8 overflow-hidden">
        <div className="h-full bg-gold-gradient transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex items-center justify-center py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={prompt.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-xl panel-strong p-7 space-y-5"
          >
            <div className="text-5xl">{prompt.emoji}</div>
            <h2 className="text-3xl font-display font-black text-balance leading-snug">{prompt.question}</h2>
            {prompt.helper && <p className="text-muted text-base">{prompt.helper}</p>}

            <PromptInput prompt={prompt} value={value} onChange={handleChange} />

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
        כל התשובות נשמרות באוטומטי. תוכלי לחזור לקישור הזה ולהשלים בהמשך.
      </div>
    </div>
  );
}

function PromptInput({
  prompt,
  value,
  onChange,
}: {
  prompt: WizardPrompt;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
}) {
  const strValue = useMemo(() => (Array.isArray(value) ? value.join(', ') : (value ?? '')), [value]);

  if (prompt.inputType === 'short_text') {
    return (
      <input
        autoFocus
        value={strValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={prompt.placeholder}
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
        placeholder={prompt.placeholder}
        rows={3}
        maxLength={280}
        className="w-full rounded-2xl bg-white/8 border border-white/15 px-4 py-3 text-lg resize-none"
      />
    );
  }
  if (prompt.inputType === 'list') {
    return (
      <div className="space-y-2">
        <input
          autoFocus
          value={strValue}
          onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean).slice(0, prompt.maxItems ?? 5))}
          placeholder={prompt.placeholder}
          className="w-full rounded-2xl bg-white/8 border border-white/15 px-4 py-4 text-lg"
        />
        <div className="text-xs text-muted">מפרידים בפסיק. עד {prompt.maxItems ?? 5} פריטים.</div>
      </div>
    );
  }
  if (prompt.inputType === 'choice' || prompt.inputType === 'multi_choice') {
    const selected = Array.isArray(value) ? value : value ? [value] : [];
    return (
      <div className="grid gap-2">
        {(prompt.options ?? []).map((opt) => {
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

function DoneScreen({ childName }: { childName: string }) {
  return (
    <div className="min-h-screen stage-vignette flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'backOut' }}
        className="panel-strong p-10 max-w-md text-center space-y-4"
      >
        <div className="text-7xl">✨</div>
        <h1 className="text-4xl font-display font-black gold-shimmer">סיימנו!</h1>
        <p className="text-muted text-lg">
          התשובות נשמרו. עכשיו המערכת תכין שאלות מותאמות אישית לאירוע של {childName}.
        </p>
        <p className="text-muted">המנחה רואה את כל מה שמילאת ויכול לערוך.</p>
        <div className="text-xs text-muted pt-4">תוכלי לסגור את החלון בלב שקט.</div>
      </motion.div>
    </div>
  );
}

function hasValue(v: string | string[] | undefined): boolean {
  if (!v) return false;
  if (Array.isArray(v)) return v.length > 0;
  return v.trim().length > 0;
}
