'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { approveGreeting, rejectGreeting } from '@/lib/game-engine/host-actions';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmButton } from '@/components/ui/ConfirmButton';
import { haptic } from '@/lib/haptics';
import type { Greeting } from '@/types/greeting';
import type { OrelEvent } from '@/types/event';

interface Props {
  greetings: Greeting[];
  event?: OrelEvent;
  onChange?: () => void;
  compact?: boolean;
}

export function ModerationQueue({ greetings, event, onChange, compact }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [autoApprove, setAutoApprove] = useState(Boolean(event?.auto_approve_greetings));
  const [savingAuto, setSavingAuto] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(event ? event.auto_advance_after_results !== false : true);
  const [savingAdvance, setSavingAdvance] = useState(false);

  const pending = greetings.filter((g) => g.moderation_status === 'pending' || g.moderation_status === 'needs_review');
  const approved = greetings.filter((g) => g.moderation_status === 'approved');

  async function toggleAutoApprove() {
    if (!event || savingAuto) return;
    const next = !autoApprove;
    setAutoApprove(next);
    setSavingAuto(true);
    haptic('light');
    try {
      const res = await fetch(`/api/events/${event.event_code}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_approve_greetings: next }),
      });
      if (!res.ok) {
        setAutoApprove(!next);
        haptic('error');
      } else {
        onChange?.();
      }
    } catch {
      setAutoApprove(!next);
    } finally {
      setSavingAuto(false);
    }
  }

  async function toggleAutoAdvance() {
    if (!event || savingAdvance) return;
    const next = !autoAdvance;
    setAutoAdvance(next);
    setSavingAdvance(true);
    haptic('light');
    try {
      const res = await fetch(`/api/events/${event.event_code}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_advance_after_results: next }),
      });
      if (!res.ok) {
        setAutoAdvance(!next);
        haptic('error');
      } else {
        onChange?.();
      }
    } catch {
      setAutoAdvance(!next);
    } finally {
      setSavingAdvance(false);
    }
  }

  async function handleApprove(g: Greeting) {
    await approveGreeting(g.id, editingId === g.id ? draft : undefined);
    setEditingId(null);
    onChange?.();
  }

  async function handleReject(g: Greeting) {
    await rejectGreeting(g.id);
    onChange?.();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold">ברכות לאישור</div>
        <div className="text-xs text-muted">
          ממתינות: <span className="text-gold-light font-bold">{pending.length}</span> · אושרו:{' '}
          <span className="text-success">{approved.length}</span>
        </div>
      </div>

      {event && (
        <button
          type="button"
          onClick={toggleAutoApprove}
          disabled={savingAuto}
          className={`w-full panel p-3 flex items-center justify-between gap-3 tap-press ${
            autoApprove ? 'border-success/40' : ''
          }`}
        >
          <div className="text-end flex-1 min-w-0">
            <div className="text-sm font-bold">
              {autoApprove ? '✓ אישור אוטומטי פעיל' : '🛡 אישור ידני (ברירת מחדל)'}
            </div>
            <div className="text-xs text-muted text-balance">
              {autoApprove
                ? 'ברכות שעוברות בדיקת AI עולות ישר לקיר — בלי תור.'
                : 'כל ברכה ממתינה לאישור שלך. מומלץ לאירוע גדול ופומבי.'}
            </div>
          </div>
          <div
            className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
              autoApprove ? 'bg-success shadow-[0_0_18px_rgba(71,255,178,0.55)]' : 'bg-white/15'
            }`}
          >
            <span
              className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${
                autoApprove ? 'right-1' : 'right-6'
              }`}
            />
          </div>
        </button>
      )}

      {event && (
        <button
          type="button"
          onClick={toggleAutoAdvance}
          disabled={savingAdvance}
          className={`w-full panel p-3 flex items-center justify-between gap-3 tap-press ${
            autoAdvance ? 'border-success/40' : ''
          }`}
        >
          <div className="text-end flex-1 min-w-0">
            <div className="text-sm font-bold">
              {autoAdvance ? '✓ המשך אוטומטי לגלגל' : '⏸ המשך ידני בלבד'}
            </div>
            <div className="text-xs text-muted text-balance">
              אחרי משחק — חוזר/ת לגלגל אוטומטית.
            </div>
          </div>
          <div
            className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
              autoAdvance ? 'bg-success shadow-[0_0_18px_rgba(71,255,178,0.55)]' : 'bg-white/15'
            }`}
          >
            <span
              className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${
                autoAdvance ? 'right-1' : 'right-6'
              }`}
            />
          </div>
        </button>
      )}
      <div className={`space-y-2 ${compact ? 'max-h-72' : 'max-h-[60vh]'} overflow-auto scrollbar-fancy pr-1`}>
        <AnimatePresence initial={false}>
          {pending.length === 0 && <div className="text-muted text-sm panel p-4">אין ברכות ממתינות.</div>}
          {pending.map((g) => (
            <motion.div
              key={g.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="panel p-3 flex gap-3"
            >
              <Avatar name={g.display_name} photoUrl={g.photo_url} size="md" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-gold-light truncate">{g.display_name}</div>
                  {g.moderation_status === 'needs_review' && (
                    <span className="text-xs text-magenta">סימן אזהרה: {g.moderation_reason}</span>
                  )}
                </div>
                {editingId === g.id ? (
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={2}
                    maxLength={280}
                    className="w-full rounded-lg bg-white/8 border border-white/15 px-3 py-2"
                  />
                ) : (
                  <div className="text-white">{g.message}</div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <button className="btn-gold py-2 px-3 text-sm" onClick={() => handleApprove(g)}>
                    אשר
                  </button>
                  <button
                    className="btn-ghost py-2 px-3 text-sm"
                    onClick={() => {
                      if (editingId === g.id) {
                        setEditingId(null);
                      } else {
                        setEditingId(g.id);
                        setDraft(g.message);
                      }
                    }}
                  >
                    {editingId === g.id ? 'בטל עריכה' : 'ערוך'}
                  </button>
                  <ConfirmButton
                    onConfirm={() => handleReject(g)}
                    className="btn-ghost py-2 px-3 text-sm border-danger/40 text-danger hover:bg-danger/10"
                    confirmLabel="לחצי שוב לדחייה"
                  >
                    דחה
                  </ConfirmButton>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {!compact && approved.length > 0 && (
        <div className="mt-4">
          <div className="text-sm text-muted mb-2">היסטוריית ברכות מאושרות</div>
          <div className="space-y-1.5 max-h-72 overflow-auto scrollbar-fancy">
            {approved.map((g) => (
              <div key={g.id} className="panel p-2 text-sm flex items-center gap-2">
                <Avatar name={g.display_name} photoUrl={g.photo_url} size="sm" />
                <span className="text-gold-light">{g.display_name}:</span>
                <span className="text-white truncate">{g.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
