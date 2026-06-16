// In-memory demo store — used when Supabase is not configured.
// Lives in the Node process; survives across requests on the same dev server.
// All mutations bump `version` so polling clients can detect changes cheaply.

import type { OrelEvent, BatMitzvahProfile } from '@/types/event';
import type { Player } from '@/types/player';
import type { Greeting } from '@/types/greeting';
import type { EventGame, GameQuestion, GameType, PlayerAnswer, SecretMission } from '@/types/game';
import type { LiveSession } from '@/types/live-session';
import { GAME_TITLES, GAME_TYPES } from '@/types/game';
import { DEMO_EVENT_CODE, DEMO_EVENT_ID } from '@/lib/env';
import { uid, randomToken } from '@/lib/utils';

type Store = {
  version: number;
  events: OrelEvent[];
  players: Player[];
  greetings: Greeting[];
  event_games: EventGame[];
  game_questions: GameQuestion[];
  live_sessions: LiveSession[];
  player_answers: PlayerAnswer[];
  secret_missions: SecretMission[];
  profiles: BatMitzvahProfile[];
};

const GLOBAL_KEY = Symbol.for('orelplay.demoStore');

function makeInitial(): Store {
  const now = new Date().toISOString();

  const demoEvent: OrelEvent = {
    id: DEMO_EVENT_ID,
    event_code: DEMO_EVENT_CODE,
    name: 'בת המצווה של רומי',
    child_name: 'רומי',
    event_type: 'bat_mitzvah',
    event_date: null,
    venue: 'אולמי הזהב',
    status: 'live',
    theme: { primary: '#D8A84E', accent: '#D82DFF' },
    host_token: 'demo-host-token-romi',
    profile_complete: false,
    auto_approve_greetings: false,
    created_at: now,
    updated_at: now,
  };

  const event_games: EventGame[] = GAME_TYPES.map((type, i) => ({
    id: `${DEMO_EVENT_ID}-game-${i + 1}`,
    event_id: demoEvent.id,
    game_type: type,
    title: GAME_TITLES[type],
    is_enabled: true,
    wheel_weight: 1,
    order_index: i,
    config: {},
    created_at: now,
  }));

  const live_session: LiveSession = {
    id: `${DEMO_EVENT_ID}-live`,
    event_id: demoEvent.id,
    stage_state: 'JOIN_SCREEN',
    active_event_game_id: null,
    active_question_id: null,
    wheel_status: 'idle',
    wheel_selected_game_id: null,
    current_payload: {},
    updated_at: now,
  };

  const game_questions = buildSeedQuestions(event_games, now);

  return {
    version: 1,
    events: [demoEvent],
    players: [],
    greetings: [],
    event_games,
    game_questions,
    live_sessions: [live_session],
    player_answers: [],
    secret_missions: [],
    profiles: [],
  };
}

function buildSeedQuestions(event_games: EventGame[], now: string): GameQuestion[] {
  const out: GameQuestion[] = [];
  const byType = (t: GameType) => event_games.find((g) => g.game_type === t)!;

  // what_are_the_chances
  const chances = byType('what_are_the_chances');
  ['מה הסיכוי שרומי תעלה סטורי לפני שהיא תאכל?', 'מה הסיכוי שרומי תבקש לצלם שוב כי “זה לא הצד שלה”?', 'מה הסיכוי שרומי תרקוד ראשונה על הרחבה?'].forEach(
    (text, i) =>
      out.push({
        id: uid('q'),
        event_game_id: chances.id,
        question_text: text,
        media_url: null,
        correct_answer: '100%',
        options: [
          { id: '1', label: 'אין סיכוי' },
          { id: '2', label: 'אולי בקטנה' },
          { id: '3', label: 'יש מצב' },
          { id: '4', label: 'ברור שכן' },
          { id: '5', label: '100%' },
        ],
        config: {},
        order_index: i,
        created_at: now,
      }),
  );

  // what_happened_next
  const next = byType('what_happened_next');
  [
    {
      q: 'רומי אמרה לאמא: אני מוכנה תוך 5 דקות. מה קרה אחר כך?',
      opts: ['באמת הייתה מוכנה', 'החליפה בגדים עוד 3 פעמים', 'צילמה טיקטוק', 'אמרה שאין לה מה ללבוש'],
      correct: '2',
    },
    {
      q: 'רומי קיבלה את העוגה למצווה. מה קרה אחר כך?',
      opts: ['צילמה לפני שטעמה', 'הציעה לכולם', 'הסתירה חתיכה לאחר כך', 'בקשה לחתוך שוב'],
      correct: '1',
    },
  ].forEach((row, i) =>
    out.push({
      id: uid('q'),
      event_game_id: next.id,
      question_text: row.q,
      media_url: null,
      correct_answer: row.correct,
      options: row.opts.map((label, j) => ({ id: String(j + 1), label })),
      config: {},
      order_index: i,
      created_at: now,
    }),
  );

  // true_or_false
  const tof = byType('true_or_false');
  [
    { q: 'רומי שולטת בריקוד היפ-הופ', correct: 'true' },
    { q: 'רומי ראתה את הסרט “כלבים” שלוש פעמים ברצף', correct: 'false' },
    { q: 'הצבע האהוב על רומי הוא סגול', correct: 'true' },
  ].forEach((row, i) =>
    out.push({
      id: uid('q'),
      event_game_id: tof.id,
      question_text: row.q,
      media_url: null,
      correct_answer: row.correct,
      options: [
        { id: 'true', label: 'נכון' },
        { id: 'false', label: 'לא נכון' },
      ],
      config: {},
      order_index: i,
      created_at: now,
    }),
  );

  // truth_or_lie
  const tol = byType('truth_or_lie');
  [
    { q: 'רומי פעם נרדמה באמצע הופעת ריקוד שלה עצמה', correct: 'lie' },
    { q: 'רומי החליטה איך תיראה המסיבה שנה לפני האירוע', correct: 'truth' },
  ].forEach((row, i) =>
    out.push({
      id: uid('q'),
      event_game_id: tol.id,
      question_text: row.q,
      media_url: null,
      correct_answer: row.correct,
      options: [
        { id: 'truth', label: 'אמת' },
        { id: 'lie', label: 'שקר' },
      ],
      config: {},
      order_index: i,
      created_at: now,
    }),
  );

  // secret_mission
  const secret = byType('secret_mission');
  ['גרום/י לשולחן שלך לעמוד ולמחוא כפיים תוך 30 שניות', 'תביא/י חברה אחת לרחבה בלי להגיד למה', 'תגרום/י לבת המצווה לחייך למצלמה', 'תמצא/י מישהו מהמשפחה שירקוד איתך 10 שניות'].forEach(
    (text, i) =>
      out.push({
        id: uid('q'),
        event_game_id: secret.id,
        question_text: text,
        media_url: null,
        correct_answer: null,
        options: [],
        config: { timer_seconds: 30 },
        order_index: i,
        created_at: now,
      }),
  );

  // musical_chairs has no questions

  return out;
}

interface GlobalWithStore {
  [GLOBAL_KEY]?: Store;
}

function getStore(): Store {
  const g = globalThis as GlobalWithStore;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = makeInitial();
  }
  return g[GLOBAL_KEY]!;
}

function bump() {
  getStore().version += 1;
}

export const demoStore = {
  version(): number {
    return getStore().version;
  },

  // events
  listEvents(): OrelEvent[] {
    return [...getStore().events];
  },
  getEventByCode(code: string): OrelEvent | null {
    return getStore().events.find((e) => e.event_code === code) ?? null;
  },
  getEventById(id: string): OrelEvent | null {
    return getStore().events.find((e) => e.id === id) ?? null;
  },
  getEventByHostToken(token: string): OrelEvent | null {
    return getStore().events.find((e) => e.host_token === token) ?? null;
  },
  updateEvent(id: string, patch: Partial<OrelEvent>): OrelEvent | null {
    const idx = getStore().events.findIndex((e) => e.id === id);
    if (idx < 0) return null;
    getStore().events[idx] = { ...getStore().events[idx], ...patch, updated_at: new Date().toISOString() };
    bump();
    return getStore().events[idx];
  },
  createEvent(input: {
    name: string;
    child_name: string;
    event_code: string;
    venue?: string;
    event_type?: 'bat_mitzvah' | 'bar_mitzvah';
  }): OrelEvent {
    const now = new Date().toISOString();
    const event: OrelEvent = {
      id: uid('evt'),
      event_code: input.event_code,
      name: input.name,
      child_name: input.child_name,
      event_type: input.event_type ?? 'bat_mitzvah',
      event_date: null,
      venue: input.venue ?? null,
      status: 'draft',
      theme: {},
      host_token: randomToken(),
      profile_complete: false,
      auto_approve_greetings: false,
      created_at: now,
      updated_at: now,
    };
    getStore().events.push(event);
    // seed event games + live session
    GAME_TYPES.forEach((type, i) => {
      getStore().event_games.push({
        id: uid('eg'),
        event_id: event.id,
        game_type: type,
        title: GAME_TITLES[type],
        is_enabled: true,
        wheel_weight: 1,
        order_index: i,
        config: {},
        created_at: now,
      });
    });
    getStore().live_sessions.push({
      id: uid('ls'),
      event_id: event.id,
      stage_state: 'JOIN_SCREEN',
      active_event_game_id: null,
      active_question_id: null,
      wheel_status: 'idle',
      wheel_selected_game_id: null,
      current_payload: {},
      updated_at: now,
    });
    bump();
    return event;
  },

  // players
  listPlayers(eventId: string): Player[] {
    return getStore()
      .players.filter((p) => p.event_id === eventId)
      .sort((a, b) => a.joined_at.localeCompare(b.joined_at));
  },
  getPlayerByToken(token: string): Player | null {
    return getStore().players.find((p) => p.session_token === token) ?? null;
  },
  getPlayerById(id: string): Player | null {
    return getStore().players.find((p) => p.id === id) ?? null;
  },
  createPlayer(input: {
    event_id: string;
    display_name: string;
    session_token: string;
    photo_url?: string;
    gender?: 'male' | 'female' | null;
  }): Player {
    const p: Player = {
      id: uid('pl'),
      event_id: input.event_id,
      display_name: input.display_name,
      photo_url: input.photo_url ?? null,
      team_name: null,
      session_token: input.session_token,
      is_child_star: false,
      gender: input.gender ?? null,
      notifications_opt_in: false,
      push_subscription: null,
      wants_to_participate: false,
      total_score: 0,
      status: 'active',
      joined_at: new Date().toISOString(),
    };
    getStore().players.push(p);
    bump();
    return p;
  },
  updatePlayer(id: string, patch: Partial<Player>): Player | null {
    const idx = getStore().players.findIndex((p) => p.id === id);
    if (idx < 0) return null;
    getStore().players[idx] = { ...getStore().players[idx], ...patch };
    bump();
    return getStore().players[idx];
  },

  // greetings
  listGreetings(eventId: string): Greeting[] {
    return getStore()
      .greetings.filter((g) => g.event_id === eventId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  createGreeting(input: Omit<Greeting, 'id' | 'created_at'>): Greeting {
    const g: Greeting = { ...input, id: uid('grt'), created_at: new Date().toISOString() };
    getStore().greetings.push(g);
    bump();
    return g;
  },
  updateGreeting(id: string, patch: Partial<Greeting>): Greeting | null {
    const idx = getStore().greetings.findIndex((g) => g.id === id);
    if (idx < 0) return null;
    getStore().greetings[idx] = { ...getStore().greetings[idx], ...patch };
    bump();
    return getStore().greetings[idx];
  },

  // event games
  listEventGames(eventId: string): EventGame[] {
    return getStore()
      .event_games.filter((g) => g.event_id === eventId)
      .sort((a, b) => a.order_index - b.order_index);
  },
  updateEventGame(id: string, patch: Partial<EventGame>): EventGame | null {
    const idx = getStore().event_games.findIndex((g) => g.id === id);
    if (idx < 0) return null;
    getStore().event_games[idx] = { ...getStore().event_games[idx], ...patch };
    bump();
    return getStore().event_games[idx];
  },
  getEventGame(id: string): EventGame | null {
    return getStore().event_games.find((g) => g.id === id) ?? null;
  },

  // questions
  listQuestions(eventGameId: string): GameQuestion[] {
    return getStore()
      .game_questions.filter((q) => q.event_game_id === eventGameId)
      .sort((a, b) => a.order_index - b.order_index);
  },
  getQuestion(id: string): GameQuestion | null {
    return getStore().game_questions.find((q) => q.id === id) ?? null;
  },

  // live session
  getLiveSession(eventId: string): LiveSession | null {
    return getStore().live_sessions.find((s) => s.event_id === eventId) ?? null;
  },
  updateLiveSession(eventId: string, patch: Partial<LiveSession>): LiveSession | null {
    const idx = getStore().live_sessions.findIndex((s) => s.event_id === eventId);
    if (idx < 0) return null;
    getStore().live_sessions[idx] = {
      ...getStore().live_sessions[idx],
      ...patch,
      updated_at: new Date().toISOString(),
    };
    bump();
    return getStore().live_sessions[idx];
  },

  // answers
  listAnswers(eventGameId: string, questionId?: string): PlayerAnswer[] {
    return getStore().player_answers.filter(
      (a) => a.event_game_id === eventGameId && (!questionId || a.question_id === questionId),
    );
  },
  createAnswer(input: Omit<PlayerAnswer, 'id' | 'created_at'>): PlayerAnswer {
    const a: PlayerAnswer = { ...input, id: uid('ans'), created_at: new Date().toISOString() };
    getStore().player_answers.push(a);
    bump();
    return a;
  },
  clearAnswersForQuestion(questionId: string) {
    getStore().player_answers = getStore().player_answers.filter((a) => a.question_id !== questionId);
    bump();
  },

  // bat-mitzvah profile
  getProfile(eventId: string): BatMitzvahProfile | null {
    return getStore().profiles.find((p) => p.event_id === eventId) ?? null;
  },
  upsertProfile(eventId: string, answers: Record<string, string | string[]>, complete: boolean): BatMitzvahProfile {
    const now = new Date().toISOString();
    const idx = getStore().profiles.findIndex((p) => p.event_id === eventId);
    if (idx >= 0) {
      getStore().profiles[idx] = {
        ...getStore().profiles[idx],
        answers: { ...getStore().profiles[idx].answers, ...answers },
        completed_at: complete ? now : getStore().profiles[idx].completed_at,
        updated_at: now,
      };
      bump();
      return getStore().profiles[idx];
    }
    const profile: BatMitzvahProfile = {
      id: uid('prof'),
      event_id: eventId,
      answers,
      completed_at: complete ? now : null,
      updated_at: now,
    };
    getStore().profiles.push(profile);
    bump();
    return profile;
  },

  // bulk question replace (used when wizard regenerates)
  replaceQuestionsForGame(eventGameId: string, rows: Omit<GameQuestion, 'created_at'>[]): GameQuestion[] {
    const now = new Date().toISOString();
    getStore().game_questions = getStore().game_questions.filter((q) => q.event_game_id !== eventGameId);
    const inserted = rows.map((r) => ({ ...r, created_at: now }));
    getStore().game_questions.push(...inserted);
    bump();
    return inserted;
  },

  // secret missions
  listMissions(eventId: string): SecretMission[] {
    return getStore().secret_missions.filter((m) => m.event_id === eventId);
  },
  createMission(input: Omit<SecretMission, 'id' | 'created_at'>): SecretMission {
    const m: SecretMission = { ...input, id: uid('mis'), created_at: new Date().toISOString() };
    getStore().secret_missions.push(m);
    bump();
    return m;
  },
  updateMission(id: string, patch: Partial<SecretMission>): SecretMission | null {
    const idx = getStore().secret_missions.findIndex((m) => m.id === id);
    if (idx < 0) return null;
    getStore().secret_missions[idx] = { ...getStore().secret_missions[idx], ...patch };
    bump();
    return getStore().secret_missions[idx];
  },
};
