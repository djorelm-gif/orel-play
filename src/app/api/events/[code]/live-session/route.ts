import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';
import { pushToEvent, type PushPayload } from '@/lib/push-server';
import type { LiveSession, StageState, WheelStatus } from '@/types/live-session';

export const dynamic = 'force-dynamic';

// Strings mirror the in-tab notify(...) calls in PlayerLive so both channels
// say the same thing.
async function buildStagePayload(
  eventId: string,
  stage: StageState,
  activeEventGameId: string | null,
): Promise<PushPayload | null> {
  switch (stage) {
    case 'WHEEL_SPINNING':
      return {
        title: '🎡 הגלגל מסתובב!',
        body: 'איזה משחק יוצא? פתח/י את האפליקציה.',
        tag: `stage:WHEEL_SPINNING:${eventId}`,
      };
    case 'GAME_INTRO': {
      let gameTitle = 'המשחק הבא';
      if (activeEventGameId) {
        try {
          const games = await dataSource.listEventGames(eventId);
          const found = games.find((g) => g.id === activeEventGameId);
          if (found?.title) gameTitle = found.title;
        } catch {
          /* ignore — fall back to default title */
        }
      }
      return {
        title: `🎮 ${gameTitle}`,
        body: 'תכף מתחילים. פתח/י את המסך.',
        tag: `stage:GAME_INTRO:${activeEventGameId ?? eventId}`,
      };
    }
    case 'GAME_ACTIVE':
      return {
        title: '⚡ ענה עכשיו!',
        body: 'השאלה פעילה — שניות ספורות לענות.',
        tag: `stage:GAME_ACTIVE:${eventId}`,
      };
    case 'BREAK_SCREEN':
      return {
        title: '☕ הפסקה קצרה',
        body: 'תכף ממשיכים. השאר/י את הטלפון פתוח.',
        tag: `stage:BREAK_SCREEN:${eventId}`,
      };
    case 'FINAL_SCREEN':
      return {
        title: '🎉 זה הסוף!',
        body: 'תודה שהייתם איתנו. ראה/י את הניקוד הסופי.',
        tag: `stage:FINAL_SCREEN:${eventId}`,
      };
    default:
      return null;
  }
}

export async function POST(req: Request, ctx: { params: { code: string } }) {
  const event = await dataSource.getEventByCode(ctx.params.code);
  if (!event) return NextResponse.json({ error: 'event not found' }, { status: 404 });

  const body = (await req.json()) as Partial<LiveSession>;
  const patch: Partial<LiveSession> = {};
  const allowedStates: StageState[] = [
    'JOIN_SCREEN',
    'GREETINGS_WALL',
    'WHEEL_IDLE',
    'WHEEL_SPINNING',
    'GAME_INTRO',
    'GAME_ACTIVE',
    'GAME_RESULTS',
    'BREAK_SCREEN',
    'FINAL_SCREEN',
  ];
  if (body.stage_state && allowedStates.includes(body.stage_state)) patch.stage_state = body.stage_state;
  if (body.active_event_game_id !== undefined) patch.active_event_game_id = body.active_event_game_id;
  if (body.active_question_id !== undefined) patch.active_question_id = body.active_question_id;
  const wheelStatuses: WheelStatus[] = ['idle', 'spinning', 'stopped'];
  if (body.wheel_status && wheelStatuses.includes(body.wheel_status)) patch.wheel_status = body.wheel_status;
  if (body.wheel_selected_game_id !== undefined) patch.wheel_selected_game_id = body.wheel_selected_game_id;
  if (body.current_payload !== undefined) patch.current_payload = body.current_payload;

  const live = await dataSource.updateLiveSession(event.id, patch);

  // Push fan-out is best-effort — wrap so a Web Push hiccup never blocks the
  // host's stage change.
  if (patch.stage_state) {
    try {
      const payload = await buildStagePayload(
        event.id,
        patch.stage_state,
        patch.active_event_game_id !== undefined
          ? patch.active_event_game_id ?? null
          : live?.active_event_game_id ?? null,
      );
      if (payload) await pushToEvent(event.id, payload);
    } catch {
      /* swallow — push must never break the state change */
    }
  }

  return NextResponse.json({ liveSession: live });
}
