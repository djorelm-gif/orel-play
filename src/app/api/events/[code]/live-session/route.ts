import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';
import type { LiveSession, StageState, WheelStatus } from '@/types/live-session';

export const dynamic = 'force-dynamic';

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
  return NextResponse.json({ liveSession: live });
}
