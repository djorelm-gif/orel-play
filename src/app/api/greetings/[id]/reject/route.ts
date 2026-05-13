import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const body = (await req.json().catch(() => ({}))) as { reason?: string };
  const greeting = await dataSource.updateGreeting(ctx.params.id, {
    moderation_status: 'rejected',
    moderation_reason: body.reason || 'לא אושר על ידי המנחה',
  });
  if (!greeting) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ greeting });
}
