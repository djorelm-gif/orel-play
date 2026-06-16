'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { StageQuestion } from '@/components/games/shared/StageQuestion';
import { AnswerTally } from '@/components/games/shared/AnswerTally';
import { OptionGrid } from '@/components/games/shared/OptionGrid';
import { HostQuestionControls } from '@/components/games/shared/HostQuestionControls';
import type { StageProps, PlayerProps, HostControlsProps } from '../types';

export function makeStage(kicker: string) {
  return function Stage({ liveSession, question, answers, eventGame }: StageProps) {
    const reveal = liveSession.stage_state === 'GAME_RESULTS';
    const intro = liveSession.stage_state === 'GAME_INTRO';
    const counts = useMemo(() => {
      const c: Record<string, number> = {};
      answers.forEach((a) => {
        if (a.answer_text) c[a.answer_text] = (c[a.answer_text] ?? 0) + 1;
      });
      return c;
    }, [answers]);

    if (intro || !question) {
      return (
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-12">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: 'backOut' }}
            className="text-center space-y-6"
          >
            <div className="chip mx-auto">
              <span className="size-2 rounded-full bg-magenta animate-pulse" />
              <span className="tracking-[0.3em]">המשחק שנבחר</span>
            </div>
            <h1 className="stage-headline font-display gold-shimmer">{eventGame.title}</h1>
            <div className="text-3xl text-muted">מתחילים בעוד רגע — תהיו מוכנים</div>
          </motion.div>
        </div>
      );
    }

    const payload = (liveSession.current_payload ?? {}) as { activated_at?: string };
    return (
      <div className="relative z-10 grid h-full grid-cols-12 gap-10 px-14 py-10">
        <div className="col-span-7 flex flex-col justify-center gap-8">
          <StageQuestion
            kicker={kicker}
            question={question.question_text}
            activatedAt={payload.activated_at ?? null}
            active={liveSession.stage_state === 'GAME_ACTIVE'}
          />
          {reveal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="panel-strong px-8 py-6 inline-flex items-center gap-4 self-start"
            >
              <div className="text-muted text-sm">התשובה הנכונה</div>
              <div className="text-4xl font-display text-success font-black">
                {question.options.find((o) => o.id === question.correct_answer)?.label ?? question.correct_answer}
              </div>
            </motion.div>
          )}
        </div>
        <div className="col-span-5 flex flex-col justify-center gap-4">
          <div className="text-sm text-muted">תשובות מהשחקנים</div>
          <div className="panel p-6">
            <AnswerTally options={question.options} counts={counts} correctId={question.correct_answer} reveal={reveal} />
          </div>
          <div className="text-sm text-muted">סה"כ הצביעו {answers.length}</div>
        </div>
      </div>
    );
  };
}

export function makePlayer() {
  return function PlayerCmp({ question, liveSession, hasAnswered, myAnswer, submitAnswer }: PlayerProps) {
    const reveal = liveSession.stage_state === 'GAME_RESULTS';
    if (!question) {
      return (
        <div className="panel-strong p-6 text-center text-xl">המתינו לשאלה הבאה…</div>
      );
    }
    return (
      <div className="space-y-6">
        <div className="text-2xl font-bold text-balance">{question.question_text}</div>
        <OptionGrid
          options={question.options}
          selectedId={myAnswer?.answer_text ?? null}
          correctId={question.correct_answer}
          reveal={reveal}
          disabled={hasAnswered || reveal || liveSession.stage_state !== 'GAME_ACTIVE'}
          onSelect={(id) => submitAnswer({ answer_text: id })}
          columns={question.options.length <= 4 ? 1 : 2}
        />
        {hasAnswered && !reveal && (
          <div className="panel p-4 text-center text-success">קיבלנו את התשובה ✓</div>
        )}
        {reveal && myAnswer && (
          <div
            className={`panel p-4 text-center text-2xl font-bold ${
              myAnswer.is_correct ? 'text-success' : 'text-danger'
            }`}
          >
            {myAnswer.is_correct ? 'צדקת! 🎉' : 'לא נכון, אבל איזה כיף ששיחקת'}
            {myAnswer.points_awarded > 0 && (
              <div className="text-lg text-gold-light mt-1">+{myAnswer.points_awarded} נקודות</div>
            )}
          </div>
        )}
      </div>
    );
  };
}

export function makeHost() {
  return function Host({ event, eventGame, liveSession, questions, answers }: HostControlsProps) {
    return (
      <div className="space-y-4">
        <div className="text-xs text-muted">{eventGame.title}</div>
        <HostQuestionControls
          eventCode={event.event_code}
          liveSession={liveSession}
          questions={questions}
          answersCount={answers.length}
        />
      </div>
    );
  };
}
