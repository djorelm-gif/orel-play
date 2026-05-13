import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, ctx: { params: { id: string } }) {
  const body = (await req.json().catch(() => ({}))) as { editedMessage?: string };
  const patch: Parameters<typeof dataSource.updateGreeting>[1] = {
    moderation_status: 'approved',
    approved_by: 'host',
    approved_at: new Date().toISOString(),
  };
  if (body.editedMessage && body.editedMessage.trim()) {
    patch.message = body.editedMessage.trim();
  }
  const greeting = await dataSource.updateGreeting(ctx.params.id, patch);
  if (!greeting) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ greeting });
}
