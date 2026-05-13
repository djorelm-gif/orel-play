import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: { code: string; gameId: string } }) {
  const questions = await dataSource.listQuestions(ctx.params.gameId);
  return NextResponse.json({ questions });
}
