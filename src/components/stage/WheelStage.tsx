'use client';

import { Wheel } from '@/components/wheel/Wheel';
import { SpotlightFX } from './fx/SpotlightFX';
import { DrumrollHUD } from './fx/DrumrollHUD';
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
    <>
      {/* Atmospheric studio lighting — beams, lens flares, haze. Sits behind
          the content so it never fights the wheel for attention but turns the
          static "wheel idle" frame into a live broadcast set. Intensity bumps
          during the spin to crank up the drama. */}
      <SpotlightFX mode="wheel" intensity={spinning ? 1 : 0.7} />

      <div className="relative z-10 grid h-full grid-cols-12 gap-10 px-12 py-10">
        <div className="col-span-5 flex flex-col justify-center gap-6">
          <div className="space-y-2">
            <div className="chip">
              <span className="size-2 rounded-full bg-magenta animate-pulse" />
              <span className="tracking-[0.3em]">גלגל המזל</span>
            </div>
            <h1 className="stage-headline-editorial font-editorial gold-shimmer leading-[0.95]">
              איזה משחק
              <br />
              יוצא עכשיו?
            </h1>
            <p className="stage-subheadline text-muted">
              הגלגל בוחר עבור {childName}. עיניים על המסך 👀
            </p>
          </div>
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

      {/* Bottom drumroll HUD only appears when the wheel is actually spinning.
          Replaces the old text panel and stays out of the way otherwise. */}
      {spinning && <DrumrollHUD label="הגלגל מסתובב — מי המנצח?" />}
    </>
  );
}
