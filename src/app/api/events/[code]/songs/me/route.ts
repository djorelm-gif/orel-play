import { NextResponse } from 'next/server';
import { dataSource } from '@/lib/data-source';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET ?session_token=… — list this player's own picks.
export async function GET(req: Request, ctx: { params: { code: string } }) {
  const event = await dataSource.getEventByCode(ctx.params.code);
  if (!event) return NextResponse.json({ picks: [] });

  const url = new URL(req.url);
  const token = url.searchParams.get('session_token');
  if (!token) return NextResponse.json({ picks: [] });

  const player = await dataSource.getPlayerByToken(token);
  if (!player || player.event_id !== event.id) {
    return NextResponse.json({ picks: [] });
  }

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ picks: [], demo: true });

  const { data } = await sb
    .from('op_song_picks')
    .select('*')
    .eq('event_id', event.id)
    .eq('player_id', player.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ picks: data ?? [] });
}

// DELETE { session_token, pick_id } — undo a pick.
export async function DELETE(req: Request, ctx: { params: { code: string } }) {
  const event = await dataSource.getEventByCode(ctx.params.code);
  if (!event) return NextResponse.json({ error: 'event not found' }, { status: 404 });

  const body = (await req.json()) as { session_token?: string; pick_id?: string };
  if (!body.session_token || !body.pick_id) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  const player = await dataSource.getPlayerByToken(body.session_token);
  if (!player || player.event_id !== event.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: true, demo: true });

  // Scope DELETE by both player_id and event_id so a token can never wipe
  // someone else's pick by guessing an id.
  const { error } = await sb
    .from('op_song_picks')
    .delete()
    .eq('id', body.pick_id)
    .eq('event_id', event.id)
    .eq('player_id', player.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
