import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';
import { randomCode } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  const events = await dataSource.listEvents();
  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    name?: string;
    child_name?: string;
    venue?: string;
    event_type?: 'bat_mitzvah' | 'bar_mitzvah';
  };
  if (!body.name || !body.child_name) {
    return NextResponse.json({ error: 'name and child_name required' }, { status: 400 });
  }
  const event = await dataSource.createEvent({
    name: body.name,
    child_name: body.child_name,
    venue: body.venue,
    event_type: body.event_type === 'bar_mitzvah' ? 'bar_mitzvah' : 'bat_mitzvah',
    event_code: randomCode(6),
  });
  return NextResponse.json({ event });
}
