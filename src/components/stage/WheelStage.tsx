'use client';

import { Wheel } from '@/components/wheel/Wheel';
import type { EventGame } from '@/types/game';
import type { LiveSession } from '@/types/live-session';

interface Props {
  games: EventGame[];
  liveSession: LiveSession;
  childName: string;
  onSpinComplete?: () => void;
}

export function WheelStage({ games, liveSession, childName, onSpinComplete }: Props) {
  const spinning = liveSession.wheel_status === 'spinning' || liveSession.stage_state === 'WHEEL_SPINNING';
  return (
    <div className="relative z-10 grid h-full grid-cols-12 gap-10 px-12 py-10">
      <div className="col-span-5 flex flex-col justify-center gap-6">
        <div className="space-y-2">
          <div className="chip">
            <span className="size-2 rounded-full bg-magenta animate-pulse" />
            <span className="tracking-[0.3em]">גלגל המזל</span>
          </div>
          <h1 className="stage-headline font-display gold-shimmer leading-[0.95]">
            איזה משחק
            <br />
            יוצא עכשיו?
          </h1>
          <p className="stage-subheadline text-muted">
            הגלגל בוחר עבור {childName}. עיניים על המסך 👀
          </p>
        </div>
        {spinning && (
          <div className="panel-strong p-5 text-center">
            <div className="text-2xl font-bold text-magenta">הגלגל מסתובב...</div>
            <div className="text-muted mt-1">המתינו לתוצאה הדרמטית</div>
          </div>
        )}
      </div>
      <div className="col-span-7 flex items-center justify-center">
        <Wheel
          games={games}
          selectedGameId={liveSession.wheel_selected_game_id}
          isSpinning={spinning}
          onSpinComplete={onSpinComplete}
          size={640}
        />
      </div>
    </div>
  );
}
