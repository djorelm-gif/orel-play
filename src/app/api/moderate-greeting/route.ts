import { NextResponse } from 'next/server';
import { moderateWithAI } from '@/lib/moderation/ai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json()) as { message?: string };
  if (!body.message) return NextResponse.json({ error: 'message required' }, { status: 400 });
  const result = await moderateWithAI(body.message);
  return NextResponse.json(result);
}
