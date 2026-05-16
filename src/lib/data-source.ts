// Single facade used by API routes. Backed by Supabase when configured, demo store otherwise.
import { demoStore } from '@/lib/demo-store';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

// All OREL PLAY tables share an `op_` prefix to coexist with other projects
// using the same Supabase project (e.g. PHOTOBOX has its own public.events).
const T = {
  events: 'op_events',
  bat_mitzvah_profile: 'op_bat_mitzvah_profile',
  players: 'op_players',
  greetings: 'op_greetings',
  event_games: 'op_event_games',
  game_questions: 'op_game_questions',
  live_sessions: 'op_live_sessions',
  player_answers: 'op_player_answers',
  secret_missions: 'op_secret_missions',
} as const;
import type { OrelEvent, BatMitzvahProfile } from '@/types/event';
import type { Player } from '@/types/player';
import type { Greeting, ModerationStatus } from '@/types/greeting';
import type { EventGame, GameQuestion, PlayerAnswer, SecretMission } from '@/types/game';
import type { LiveSession } from '@/types/live-session';

function backed() {
  return getSupabaseAdmin();
}

export const dataSource = {
  isDemo(): boolean {
    return !backed();
  },

  // -------------- events --------------
  async getEventByCode(code: string): Promise<OrelEvent | null> {
    const sb = backed();
    if (!sb) return demoStore.getEventByCode(code);
    const { data } = await sb.from(T.events).select('*').eq('event_code', code).maybeSingle();
    return (data as OrelEvent | null) ?? null;
  },
  async getEventById(id: string): Promise<OrelEvent | null> {
    const sb = backed();
    if (!sb) return demoStore.getEventById(id);
    const { data } = await sb.from(T.events).select('*').eq('id', id).maybeSingle();
    return (data as OrelEvent | null) ?? null;
  },
  async listEvents(): Promise<OrelEvent[]> {
    const sb = backed();
    if (!sb) return demoStore.listEvents();
    const { data } = await sb.from(T.events).select('*').order('created_at', { ascending: false });
    return (data as OrelEvent[] | null) ?? [];
  },
  async createEvent(input: {
    name: string;
    child_name: string;
    event_code: string;
    venue?: string;
    event_type?: 'bat_mitzvah' | 'bar_mitzvah';
  }): Promise<OrelEvent> {
    const sb = backed();
    if (!sb) return demoStore.createEvent(input);
    // Trigger seeds host_token + 6 event_games + live_session automatically.
    const { data, error } = await sb.from(T.events).insert(input).select().single();
    if (error) throw new Error(error.message);
    return data as OrelEvent;
  },

  async getEventByHostToken(token: string): Promise<OrelEvent | null> {
    const sb = backed();
    if (!sb) return demoStore.getEventByHostToken(token);
    const { data } = await sb.from(T.events).select('*').eq('host_token', token).maybeSingle();
    return (data as OrelEvent | null) ?? null;
  },

  async updateEvent(id: string, patch: Partial<OrelEvent>): Promise<OrelEvent | null> {
    const sb = backed();
    if (!sb) return demoStore.updateEvent(id, patch);
    const { data, error } = await sb
      .from(T.events)
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as OrelEvent;
  },

  // -------------- bat-mitzvah profile --------------
  async getProfile(eventId: string): Promise<BatMitzvahProfile | null> {
    const sb = backed();
    if (!sb) return demoStore.getProfile(eventId);
    const { data } = await sb.from(T.bat_mitzvah_profile).select('*').eq('event_id', eventId).maybeSingle();
    return (data as BatMitzvahProfile | null) ?? null;
  },
  async upsertProfile(eventId: string, answers: Record<string, string | string[]>, complete: boolean): Promise<BatMitzvahProfile> {
    const sb = backed();
    if (!sb) return demoStore.upsertProfile(eventId, answers, complete);
    const now = new Date().toISOString();
    const existing = await this.getProfile(eventId);
    if (existing) {
      const merged = { ...existing.answers, ...answers };
      const { data, error } = await sb
        .from(T.bat_mitzvah_profile)
        .update({
          answers: merged,
          completed_at: complete ? now : existing.completed_at,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as BatMitzvahProfile;
    }
    const { data, error } = await sb
      .from(T.bat_mitzvah_profile)
      .insert({
        event_id: eventId,
        answers,
        completed_at: complete ? now : null,
        updated_at: now,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as BatMitzvahProfile;
  },

  async replaceQuestionsForGame(
    eventGameId: string,
    rows: Array<Omit<GameQuestion, 'id' | 'created_at'> & { id?: string }>,
  ): Promise<GameQuestion[]> {
    const sb = backed();
    if (!sb) {
      // Demo store path needs ids — generate them locally
      const { uid } = await import('@/lib/utils');
      return demoStore.replaceQuestionsForGame(
        eventGameId,
        rows.map((r) => ({ ...r, id: r.id ?? uid('q') })),
      );
    }
    await sb.from(T.game_questions).delete().eq('event_game_id', eventGameId);
    if (rows.length === 0) return [];
    // Strip id so Supabase generates UUIDs
    const stripped = rows.map(({ id: _id, ...rest }) => rest);
    const { data, error } = await sb.from(T.game_questions).insert(stripped).select();
    if (error) throw new Error(error.message);
    return (data as GameQuestion[]) ?? [];
  },

  // -------------- players --------------
  async listPlayers(eventId: string): Promise<Player[]> {
    const sb = backed();
    if (!sb) return demoStore.listPlayers(eventId);
    const { data } = await sb
      .from(T.players)
      .select('*')
      .eq('event_id', eventId)
      .order('joined_at', { ascending: true });
    return (data as Player[] | null) ?? [];
  },
  async getPlayerByToken(token: string): Promise<Player | null> {
    const sb = backed();
    if (!sb) return demoStore.getPlayerByToken(token);
    const { data } = await sb.from(T.players).select('*').eq('session_token', token).maybeSingle();
    return (data as Player | null) ?? null;
  },
  async getPlayerById(id: string): Promise<Player | null> {
    const sb = backed();
    if (!sb) return demoStore.getPlayerById(id);
    const { data } = await sb.from(T.players).select('*').eq('id', id).maybeSingle();
    return (data as Player | null) ?? null;
  },
  async createPlayer(input: {
    event_id: string;
    display_name: string;
    session_token: string;
    photo_url?: string;
    gender?: 'male' | 'female' | null;
  }): Promise<Player> {
    const sb = backed();
    if (!sb) return demoStore.createPlayer(input);
    const { data, error } = await sb.from(T.players).insert(input).select().single();
    if (error) throw new Error(error.message);
    return data as Player;
  },

  async updatePlayer(id: string, patch: Partial<Player>): Promise<Player | null> {
    const sb = backed();
    if (!sb) return demoStore.updatePlayer(id, patch);
    const { data, error } = await sb.from(T.players).update(patch).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as Player;
  },

  // -------------- greetings --------------
  async listGreetings(eventId: string): Promise<Greeting[]> {
    const sb = backed();
    if (!sb) return demoStore.listGreetings(eventId);
    const { data } = await sb
      .from(T.greetings)
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    return (data as Greeting[] | null) ?? [];
  },
  async listApprovedGreetings(eventId: string): Promise<Greeting[]> {
    const all = await this.listGreetings(eventId);
    return all.filter((g) => g.moderation_status === 'approved');
  },
  async createGreeting(input: {
    event_id: string;
    player_id: string | null;
    display_name: string;
    photo_url: string | null;
    message: string;
    moderation_status: ModerationStatus;
    moderation_reason: string | null;
  }): Promise<Greeting> {
    const sb = backed();
    const payload: Omit<Greeting, 'id' | 'created_at'> = {
      ...input,
      approved_by: null,
      approved_at: null,
      shown_on_stage: false,
    };
    if (!sb) return demoStore.createGreeting(payload);
    const { data, error } = await sb.from(T.greetings).insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as Greeting;
  },
  async updateGreeting(id: string, patch: Partial<Greeting>): Promise<Greeting | null> {
    const sb = backed();
    if (!sb) return demoStore.updateGreeting(id, patch);
    const { data, error } = await sb.from(T.greetings).update(patch).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as Greeting;
  },

  // -------------- event games --------------
  async listEventGames(eventId: string): Promise<EventGame[]> {
    const sb = backed();
    if (!sb) return demoStore.listEventGames(eventId);
    const { data } = await sb
      .from(T.event_games)
      .select('*')
      .eq('event_id', eventId)
      .order('order_index', { ascending: true });
    return (data as EventGame[] | null) ?? [];
  },
  async getEventGame(id: string): Promise<EventGame | null> {
    const sb = backed();
    if (!sb) return demoStore.getEventGame(id);
    const { data } = await sb.from(T.event_games).select('*').eq('id', id).maybeSingle();
    return (data as EventGame | null) ?? null;
  },
  async updateEventGame(id: string, patch: Partial<EventGame>): Promise<EventGame | null> {
    const sb = backed();
    if (!sb) return demoStore.updateEventGame(id, patch);
    const { data, error } = await sb.from(T.event_games).update(patch).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as EventGame;
  },

  // -------------- questions --------------
  async listQuestions(eventGameId: string): Promise<GameQuestion[]> {
    const sb = backed();
    if (!sb) return demoStore.listQuestions(eventGameId);
    const { data } = await sb
      .from(T.game_questions)
      .select('*')
      .eq('event_game_id', eventGameId)
      .order('order_index', { ascending: true });
    return (data as GameQuestion[] | null) ?? [];
  },
  async getQuestion(id: string): Promise<GameQuestion | null> {
    const sb = backed();
    if (!sb) return demoStore.getQuestion(id);
    const { data } = await sb.from(T.game_questions).select('*').eq('id', id).maybeSingle();
    return (data as GameQuestion | null) ?? null;
  },

  // -------------- live session --------------
  async getLiveSession(eventId: string): Promise<LiveSession | null> {
    const sb = backed();
    if (!sb) return demoStore.getLiveSession(eventId);
    const { data } = await sb.from(T.live_sessions).select('*').eq('event_id', eventId).maybeSingle();
    return (data as LiveSession | null) ?? null;
  },
  async updateLiveSession(eventId: string, patch: Partial<LiveSession>): Promise<LiveSession | null> {
    const sb = backed();
    if (!sb) return demoStore.updateLiveSession(eventId, patch);
    const { data, error } = await sb
      .from(T.live_sessions)
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('event_id', eventId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as LiveSession;
  },

  // -------------- answers --------------
  async listAnswers(eventGameId: string, questionId?: string): Promise<PlayerAnswer[]> {
    const sb = backed();
    if (!sb) return demoStore.listAnswers(eventGameId, questionId);
    let q = sb.from(T.player_answers).select('*').eq('event_game_id', eventGameId);
    if (questionId) q = q.eq('question_id', questionId);
    const { data } = await q;
    return (data as PlayerAnswer[] | null) ?? [];
  },
  async createAnswer(input: Omit<PlayerAnswer, 'id' | 'created_at'>): Promise<PlayerAnswer> {
    const sb = backed();
    if (!sb) return demoStore.createAnswer(input);
    const { data, error } = await sb.from(T.player_answers).insert(input).select().single();
    if (error) throw new Error(error.message);
    return data as PlayerAnswer;
  },

  // -------------- secret missions --------------
  async listMissions(eventId: string): Promise<SecretMission[]> {
    const sb = backed();
    if (!sb) return demoStore.listMissions(eventId);
    const { data } = await sb.from(T.secret_missions).select('*').eq('event_id', eventId);
    return (data as SecretMission[] | null) ?? [];
  },
  async createMission(input: Omit<SecretMission, 'id' | 'created_at'>): Promise<SecretMission> {
    const sb = backed();
    if (!sb) return demoStore.createMission(input);
    const { data, error } = await sb.from(T.secret_missions).insert(input).select().single();
    if (error) throw new Error(error.message);
    return data as SecretMission;
  },
  async updateMission(id: string, patch: Partial<SecretMission>): Promise<SecretMission | null> {
    const sb = backed();
    if (!sb) return demoStore.updateMission(id, patch);
    const { data, error } = await sb.from(T.secret_missions).update(patch).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data as SecretMission;
  },
};
