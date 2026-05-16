import type { GameType, GameQuestion } from '@/types/game';
import { getAnswer, getList, type WizardAnswers } from './questions';
import { generateQuestionsAI, type GeneratedQuestion as AIGen } from './generator-ai';

export type GeneratedQuestion = AIGen;

const TRUE_FALSE_OPTS = [
  { id: 'true', label: 'נכון' },
  { id: 'false', label: 'לא נכון' },
];

const TRUTH_LIE_OPTS = [
  { id: 'truth', label: 'אמת' },
  { id: 'lie', label: 'שקר' },
];

const CHANCE_OPTS = [
  { id: '1', label: 'אין סיכוי' },
  { id: '2', label: 'אולי בקטנה' },
  { id: '3', label: 'יש מצב' },
  { id: '4', label: 'ברור שכן' },
  { id: '5', label: '100%' },
];

// Try the GPT-powered generator first — it writes personalised, gendered,
// dor-Z Hebrew using the full profile. Falls back to the deterministic
// template generator if OpenAI is unavailable or returns an empty/bad payload
// so the show never lands without questions.
export async function generateQuestionsForEvent(
  childName: string,
  isFemale: boolean,
  answers: WizardAnswers,
): Promise<GeneratedQuestion[]> {
  const ai = await generateQuestionsAI(childName, isFemale, answers);
  if (ai && ai.length >= 10) return ai;
  return generateQuestions(childName, answers);
}

// Deterministic template generator — kept as a fallback and for the demo
// store. Hebrew here is feminine-leaning (legacy from when the app was bat-
// mitzvah only); the AI generator is what runs in production.
export function generateQuestions(childName: string, answers: WizardAnswers): GeneratedQuestion[] {
  const name = childName.trim() || 'הילדה';
  const out: GeneratedQuestion[] = [];

  // ─────── true_or_false: facts from her answers ───────
  const fav = getAnswer(answers, 'favorite_food');
  const hate = getAnswer(answers, 'hate_food');
  const bestFriend = getAnswer(answers, 'best_friend');
  const song = getAnswer(answers, 'favorite_song');
  const show = getAnswer(answers, 'favorite_show');
  const job = getAnswer(answers, 'dream_job');
  const travel = getAnswer(answers, 'travel_dream');
  const quote = getAnswer(answers, 'famous_quote');

  if (fav) {
    out.push({
      game_type: 'true_or_false',
      question_text: `${name} הכי אוהבת לאכול ${fav}`,
      options: TRUE_FALSE_OPTS,
      correct_answer: 'true',
      config: {},
    });
  }
  if (hate) {
    out.push({
      game_type: 'true_or_false',
      question_text: `${name} שונאת ${hate}`,
      options: TRUE_FALSE_OPTS,
      correct_answer: 'true',
      config: {},
    });
    // נחבר עם מאכל מומצא לבדיקה
    out.push({
      game_type: 'true_or_false',
      question_text: `${name} מתה על ${hate} ומבקשת שיהיה באירוע`,
      options: TRUE_FALSE_OPTS,
      correct_answer: 'false',
      config: {},
    });
  }
  if (song) {
    out.push({
      game_type: 'true_or_false',
      question_text: `השיר שחייב להיות באירוע של ${name} הוא "${song}"`,
      options: TRUE_FALSE_OPTS,
      correct_answer: 'true',
      config: {},
    });
  }
  if (show) {
    out.push({
      game_type: 'true_or_false',
      question_text: `${name} ראתה את "${show}" בגייט-בינג`,
      options: TRUE_FALSE_OPTS,
      correct_answer: 'true',
      config: {},
    });
  }
  if (job) {
    out.push({
      game_type: 'true_or_false',
      question_text: `כשהיא תגדל, ${name} רוצה להיות ${job}`,
      options: TRUE_FALSE_OPTS,
      correct_answer: 'true',
      config: {},
    });
  }

  // ─────── what_are_the_chances ───────
  if (fav) {
    out.push({
      game_type: 'what_are_the_chances',
      question_text: `מה הסיכוי ש${name} תזמין ${fav} למחרת בבוקר?`,
      options: CHANCE_OPTS,
      correct_answer: '5',
      config: {},
    });
  }
  if (bestFriend) {
    out.push({
      game_type: 'what_are_the_chances',
      question_text: `מה הסיכוי ש${name} ו${bestFriend} יצחקו ביחד עד שתיפול אחת?`,
      options: CHANCE_OPTS,
      correct_answer: '5',
      config: {},
    });
  }
  const phoneHabit = getAnswer(answers, 'phone_time');
  if (phoneHabit.includes('שעות') || phoneHabit.includes('יד')) {
    out.push({
      game_type: 'what_are_the_chances',
      question_text: `מה הסיכוי ש${name} תיגע בטלפון ב-10 הדקות הקרובות?`,
      options: CHANCE_OPTS,
      correct_answer: '5',
      config: {},
    });
  }
  const tiktok = getAnswer(answers, 'tiktok_habit');
  if (tiktok.includes('מעלה') || tiktok.includes('מצלמת')) {
    out.push({
      game_type: 'what_are_the_chances',
      question_text: `מה הסיכוי ש${name} תעלה סטורי מהאירוע לפני שהיא תאכל?`,
      options: CHANCE_OPTS,
      correct_answer: '5',
      config: {},
    });
  }
  const morning = getAnswer(answers, 'morning_struggle');
  if (morning.includes('5 דקות') || morning.includes('שמיכה') || morning.includes('4 פעמים')) {
    out.push({
      game_type: 'what_are_the_chances',
      question_text: `מה הסיכוי ש${name} תקום ראשונה מהשולחן לרחבת הריקודים?`,
      options: CHANCE_OPTS,
      correct_answer: '3',
      config: {},
    });
  }
  if (travel) {
    out.push({
      game_type: 'what_are_the_chances',
      question_text: `מה הסיכוי ש${name} כבר תכננה את הטיול הבא ל${travel}?`,
      options: CHANCE_OPTS,
      correct_answer: '4',
      config: {},
    });
  }

  // ─────── what_happened_next ───────
  const familyQuirk = getAnswer(answers, 'family_quirk');
  if (familyQuirk) {
    out.push({
      game_type: 'what_happened_next',
      question_text: `${name} סיפרה: "${familyQuirk}". מה קרה אחר כך?`,
      options: [
        { id: '1', label: `${name} צילמה הכל בסתר` },
        { id: '2', label: 'כולם פשוט המשיכו רגיל' },
        { id: '3', label: 'הפך לקטע משפחתי' },
        { id: '4', label: `${name} ברחה לחדר` },
      ],
      correct_answer: '3',
      config: {},
    });
  }
  if (quote) {
    out.push({
      game_type: 'what_happened_next',
      question_text: `${name} אמרה "${quote}" 5 פעמים ברצף. מה קרה אחר כך?`,
      options: [
        { id: '1', label: 'כולם הצטרפו' },
        { id: '2', label: 'אמא ביקשה שתפסיק' },
        { id: '3', label: 'זה הפך לסלוגן של היום' },
        { id: '4', label: 'איש לא שם לב' },
      ],
      correct_answer: '3',
      config: {},
    });
  }
  if (morning && bestFriend) {
    out.push({
      game_type: 'what_happened_next',
      question_text: `${bestFriend} העירה את ${name} בשבת בבוקר. מה קרה אחר כך?`,
      options: [
        { id: '1', label: `${name} ענתה בצרחה` },
        { id: '2', label: 'התחבאה מתחת לשמיכה' },
        { id: '3', label: 'קמה לקפה ושכבה שוב' },
        { id: '4', label: 'התעוררה והודיעה שמתה מרעב' },
      ],
      correct_answer: '2',
      config: {},
    });
  }

  // ─────── truth_or_lie ───────
  const truth = getAnswer(answers, 'truth');
  const lie = getAnswer(answers, 'lie');
  if (truth) {
    out.push({
      game_type: 'truth_or_lie',
      question_text: `${name} מספרת: "${truth}"`,
      options: TRUTH_LIE_OPTS,
      correct_answer: 'truth',
      config: {},
    });
  }
  if (lie) {
    out.push({
      game_type: 'truth_or_lie',
      question_text: `${name} מספרת: "${lie}"`,
      options: TRUTH_LIE_OPTS,
      correct_answer: 'lie',
      config: {},
    });
  }

  // ─────── secret_mission (using her quirks as fodder) ───────
  const missions: string[] = [];
  if (fav) missions.push(`תכנעי שולחן אחר לזמן ל${name} עוד מנה של ${fav}`);
  if (song) missions.push(`גרמי לבן משפחה לרקוד עם ${name} ל"${song}"`);
  if (bestFriend) missions.push(`תגרמי ל${bestFriend} ול${name} להיות צמד הריקוד של הסיבוב הבא`);
  if (quote) missions.push(`גרמי ל-3 אנשים שונים להגיד "${quote}" תוך 5 דקות`);
  missions.push(`תגרמי ל${name} לחייך 3 פעמים למצלמה תוך 30 שניות`);
  missions.push(`תאתרי מישהו עם חולצה צבעונית ושכנעי אותו לרקוד עם ${name}`);

  missions.slice(0, 6).forEach((text) => {
    out.push({
      game_type: 'secret_mission',
      question_text: text,
      options: [],
      correct_answer: null,
      config: { timer_seconds: 30 },
    });
  });

  return out;
}

// Convert generated questions into rows ready for game_questions insert,
// grouping them under the right event_game_id. No id — DB generates it.
export function buildQuestionRows(
  generated: GeneratedQuestion[],
  eventGamesByType: Record<GameType, string>,
): Array<Omit<GameQuestion, 'id' | 'created_at'>> {
  const out: Array<Omit<GameQuestion, 'id' | 'created_at'>> = [];
  const indexByType = new Map<GameType, number>();

  generated.forEach((q) => {
    const eventGameId = eventGamesByType[q.game_type];
    if (!eventGameId) return; // game not enabled for this event
    const idx = indexByType.get(q.game_type) ?? 0;
    indexByType.set(q.game_type, idx + 1);
    out.push({
      event_game_id: eventGameId,
      question_text: q.question_text,
      media_url: null,
      correct_answer: q.correct_answer,
      options: q.options,
      config: q.config,
      order_index: idx,
    });
  });
  return out;
}
