import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, ctx: { params: { code: string; gameId: string } }) {
  const event = await dataSource.getEventByCode(ctx.params.code);
  if (!event) return NextResponse.json({ error: 'event not found' }, { status: 404 });
  const body = (await req.json()) as { is_enabled?: boolean; wheel_weight?: number; title?: string };
  const patch: Record<string, unknown> = {};
  if (typeof body.is_enabled === 'boolean') patch.is_enabled = body.is_enabled;
  if (typeof body.wheel_weight === 'number') patch.wheel_weight = body.wheel_weight;
  if (typeof body.title === 'string') patch.title = body.title;
  const game = await dataSource.updateEventGame(ctx.params.gameId, patch);
  return NextResponse.json({ game });
}
