import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, ctx: { params: { code: string } }) {
  const event = await dataSource.getEventByCode(ctx.params.code);
  if (!event) return NextResponse.json({ error: 'event not found' }, { status: 404 });

  const body = (await req.json()) as {
    session_token?: string;
    answer_text?: string;
    answer_payload?: Record<string, unknown>;
    response_time_ms?: number;
  };
  if (!body.session_token || !body.answer_text) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  const player = await dataSource.getPlayerByToken(body.session_token);
  if (!player || player.event_id !== event.id) {
    return NextResponse.json({ error: 'invalid player' }, { status: 403 });
  }

  const live = await dataSource.getLiveSession(event.id);
  if (!live?.active_event_game_id || !live?.active_question_id) {
    return NextResponse.json({ error: 'no active question' }, { status: 400 });
  }
  if (live.stage_state !== 'GAME_ACTIVE') {
    return NextResponse.json({ error: 'game not active' }, { status: 400 });
  }

  const question = await dataSource.getQuestion(live.active_question_id);
  if (!question) return NextResponse.json({ error: 'question missing' }, { status: 400 });

  const isCorrect = question.correct_answer != null ? body.answer_text === question.correct_answer : null;

  const existing = await dataSource.listAnswers(live.active_event_game_id, live.active_question_id);
  if (existing.some((a) => a.player_id === player.id)) {
    return NextResponse.json({ error: 'כבר ענית' }, { status: 409 });
  }

  const speedBonus =
    body.response_time_ms != null && body.response_time_ms < 8000
      ? Math.round(50 * (1 - body.response_time_ms / 8000))
      : 0;
  const pointsAwarded = isCorrect ? 100 + speedBonus : 0;

  const answer = await dataSource.createAnswer({
    event_id: event.id,
    player_id: player.id,
    event_game_id: live.active_event_game_id,
    question_id: live.active_question_id,
    answer_text: body.answer_text,
    answer_payload: body.answer_payload ?? {},
    is_correct: isCorrect,
    points_awarded: pointsAwarded,
    response_time_ms: body.response_time_ms ?? null,
  });

  return NextResponse.json({ answer });
}
