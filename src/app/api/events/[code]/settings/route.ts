import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';

export const dynamic = 'force-dynamic';

// Host-only event toggles. Body is a partial OrelEvent patch; only the
// fields below are accepted so the endpoint can't be used to mutate
// child_name, host_token, etc.
const ALLOWED_KEYS = ['auto_approve_greetings', 'auto_advance_after_results'] as const;
type AllowedKey = (typeof ALLOWED_KEYS)[number];

export async function POST(req: Request, ctx: { params: { code: string } }) {
  const event = await dataSource.getEventByCode(ctx.params.code);
  if (!event) return NextResponse.json({ error: 'event not found' }, { status: 404 });

  const body = (await req.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = {};
  for (const key of ALLOWED_KEYS) {
    if (key in body) patch[key as AllowedKey] = Boolean(body[key]);
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'no allowed fields' }, { status: 400 });
  }

  const updated = await dataSource.updateEvent(event.id, patch);
  return NextResponse.json({ event: updated });
}
