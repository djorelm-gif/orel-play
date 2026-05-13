import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: { code: string } }) {
  const event = await dataSource.getEventByCode(ctx.params.code);
  if (!event) return NextResponse.json({ greetings: [] });
  const greetings = await dataSource.listGreetings(event.id);
  return NextResponse.json({ greetings });
}
