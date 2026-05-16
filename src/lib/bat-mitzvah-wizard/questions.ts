// The wizard interview script. The Bat / Bar Mitzvah child fills these out;
// answers feed the generator that produces personalised game questions.
//
// Every player-visible field is `Localized` — either a single string (gender-
// neutral) or a `{ f, m }` pair so we can address the child in the correct
// Hebrew grammar based on the event_type.

import type { EventType } from '@/types/event';

export type WizardCategory =
  | 'identity'
  | 'food'
  | 'school'
  | 'social'
  | 'habits'
  | 'pop_culture'
  | 'dreams'
  | 'embarrassing'
  | 'family';

export type WizardInputType =
  | 'short_text'
  | 'long_text'
  | 'list'
  | 'choice'
  | 'multi_choice'
  | 'truth_lie';

type Localized = string | { f: string; m: string };
type LocalizedList = string[] | { f: string[]; m: string[] };

export interface WizardPrompt {
  id: string;
  category: WizardCategory;
  inputType: WizardInputType;
  emoji: string;
  question: Localized;
  helper?: Localized;
  placeholder?: Localized;
  options?: LocalizedList;
  maxItems?: number;
  required?: boolean;
}

// Resolve a Localized value to a plain string for the given event type.
export function loc(v: Localized | undefined, eventType: EventType): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return eventType === 'bar_mitzvah' ? v.m : v.f;
}

export function locList(v: LocalizedList | undefined, eventType: EventType): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  return eventType === 'bar_mitzvah' ? v.m : v.f;
}

// Ordered: gentle warmup → quirky → bolder.
export const WIZARD_PROMPTS: WizardPrompt[] = [
  // ───────── זהות / חימום ─────────
  {
    id: 'nickname',
    category: 'identity',
    inputType: 'short_text',
    emoji: '✨',
    question: { f: 'איך קוראים לך החברות?', m: 'איך קוראים לך החברים?' },
    helper: 'אם יש לך כינוי או קיצור — זה הזמן',
    placeholder: { f: 'לדוגמה: רומיק / ר', m: 'לדוגמה: דניק / ד' },
  },
  {
    id: 'three_words',
    category: 'identity',
    inputType: 'list',
    emoji: '🎯',
    question: { f: 'תכתבי 3 מילים שמתארות אותך', m: 'תכתוב 3 מילים שמתארות אותך' },
    helper: {
      f: 'מצחיקה? עקשנית? חולת ריקודים? תהיי כנה',
      m: 'מצחיק? עקשן? חולה ריקודים? תהיה כן',
    },
    placeholder: { f: 'מצחיקה, אנרגטית, דרמטית', m: 'מצחיק, אנרגטי, דרמטי' },
    maxItems: 3,
    required: true,
  },

  // ───────── אוכל ─────────
  {
    id: 'favorite_food',
    category: 'food',
    inputType: 'short_text',
    emoji: '🍕',
    question: { f: 'מה האוכל האהוב עלייך בעולם?', m: 'מה האוכל האהוב עליך בעולם?' },
    helper: 'משהו אחד, האולטימטיבי',
    placeholder: 'פיצה עם אננס',
    required: true,
  },
  {
    id: 'hate_food',
    category: 'food',
    inputType: 'short_text',
    emoji: '🤢',
    question: { f: 'מה את הכי שונאת לאכול?', m: 'מה אתה הכי שונא לאכול?' },
    helper: 'לא נשפוט. כמעט',
    placeholder: 'גזר מבושל',
    required: true,
  },
  {
    id: 'breakfast_habit',
    category: 'food',
    inputType: 'choice',
    emoji: '🥐',
    question: { f: 'מה את בדרך כלל אוכלת בבוקר?', m: 'מה אתה בדרך כלל אוכל בבוקר?' },
    options: {
      f: ['כלום, מוותרת', 'פיתה עם נוטלה', 'דייסה / קורנפלקס', 'משהו מלוח', 'תלוי במצב רוח'],
      m: ['כלום, מוותר', 'פיתה עם נוטלה', 'דייסה / קורנפלקס', 'משהו מלוח', 'תלוי במצב רוח'],
    },
  },

  // ───────── חברה / משפחה ─────────
  {
    id: 'best_friend',
    category: 'social',
    inputType: 'short_text',
    emoji: '💛',
    question: { f: 'מי החברה הכי טובה שלך?', m: 'מי החבר הכי טוב שלך?' },
    helper: {
      f: 'נקרא לה ככה במשחק. אם יש כמה, הראשונה שעולה לראש',
      m: 'נקרא לו ככה במשחק. אם יש כמה, הראשון שעולה לראש',
    },
    placeholder: { f: 'נועה', m: 'יונתן' },
    required: true,
  },
  {
    id: 'family_quirk',
    category: 'family',
    inputType: 'long_text',
    emoji: '👨‍👩‍👧',
    question: 'מה הדבר הכי מצחיק שמישהו במשפחה שלך עושה?',
    helper: {
      f: 'אבא מנגן גיטרה ושר רע? אמא רוקדת לטיקטוק? סבתא מדברת ברוסית? תכתבי משפט',
      m: 'אבא מנגן גיטרה ושר רע? אמא רוקדת לטיקטוק? סבתא מדברת ברוסית? תכתוב משפט',
    },
    placeholder: 'אבא מנסה לרקוד תמיד וזה זוועה',
  },

  // ───────── הרגלים / קוויקים ─────────
  {
    id: 'phone_time',
    category: 'habits',
    inputType: 'choice',
    emoji: '📱',
    question: { f: 'כמה זמן את בטלפון ביום?', m: 'כמה זמן אתה בטלפון ביום?' },
    options: ['פחות משעה', '1-3 שעות', '3-5 שעות', '5-8 שעות', 'הוא חלק מהיד שלי'],
  },
  {
    id: 'tiktok_habit',
    category: 'habits',
    inputType: 'choice',
    emoji: '🎵',
    question: { f: 'את מצלמת טיקטוקים?', m: 'אתה מצלם טיקטוקים?' },
    options: {
      f: ['בחיים לא', 'לפעמים בסתר', 'מצלמת אבל לא מעלה', 'מעלה כל יום', 'אני INFLUENCER'],
      m: ['בחיים לא', 'לפעמים בסתר', 'מצלם אבל לא מעלה', 'מעלה כל יום', 'אני INFLUENCER'],
    },
  },
  {
    id: 'famous_quote',
    category: 'habits',
    inputType: 'short_text',
    emoji: '🗣️',
    question: {
      f: 'מה המשפט שאת אומרת הכי הרבה?',
      m: 'מה המשפט שאתה אומר הכי הרבה?',
    },
    helper: 'משהו שכולם מזהים — "ברצינות?", "אין מצב", "וואלה" וכו',
    placeholder: 'אין מצב!',
  },
  {
    id: 'morning_struggle',
    category: 'habits',
    inputType: 'choice',
    emoji: '🛏️',
    question: { f: 'כשאמא מעירה אותך בבוקר את:', m: 'כשאמא מעירה אותך בבוקר אתה:' },
    options: {
      f: [
        'קופצת מיד',
        'אומרת "עוד 5 דקות"',
        'מתחבאת מתחת לשמיכה',
        'עונה בסינית',
        'צריך להעיר אותי 4 פעמים',
      ],
      m: [
        'קופץ מיד',
        'אומר "עוד 5 דקות"',
        'מתחבא מתחת לשמיכה',
        'עונה בסינית',
        'צריך להעיר אותי 4 פעמים',
      ],
    },
  },

  // ───────── תרבות פופ ─────────
  {
    id: 'favorite_song',
    category: 'pop_culture',
    inputType: 'short_text',
    emoji: '🎤',
    question: {
      f: 'השיר שאת חייבת לרקוד עליו באירוע?',
      m: 'השיר שאתה חייב לרקוד עליו באירוע?',
    },
    placeholder: 'Espresso של Sabrina Carpenter',
    required: true,
  },
  {
    id: 'favorite_show',
    category: 'pop_culture',
    inputType: 'short_text',
    emoji: '📺',
    question: 'הסדרה האחרונה שעשתה לך binge?',
    placeholder: 'Wednesday',
  },
  {
    id: 'celeb_crush',
    category: 'pop_culture',
    inputType: 'short_text',
    emoji: '💖',
    question: {
      f: 'על איזה ידוען/ת היית מתעלפת אם היית פוגשת במציאות?',
      m: 'על איזה ידוען/ת היית מתעלף אם היית פוגש במציאות?',
    },
    helper: {
      f: 'אל תתביישי, גם החברות יודעות',
      m: 'אל תתבייש, גם החברים יודעים',
    },
    placeholder: 'טימותי שלאמה',
  },

  // ───────── חלומות ─────────
  {
    id: 'dream_job',
    category: 'dreams',
    inputType: 'short_text',
    emoji: '🚀',
    question: { f: 'מה את רוצה להיות כשתגדלי?', m: 'מה אתה רוצה להיות כשתגדל?' },
    placeholder: {
      f: 'רופאה / יוצרת תוכן / בלי מושג',
      m: 'רופא / יוצר תוכן / בלי מושג',
    },
  },
  {
    id: 'travel_dream',
    category: 'dreams',
    inputType: 'short_text',
    emoji: '✈️',
    question: { f: 'לאן את הכי רוצה לטוס בעולם?', m: 'לאן אתה הכי רוצה לטוס בעולם?' },
    placeholder: 'יפן',
  },

  // ───────── אמת או שקר ─────────
  {
    id: 'truth',
    category: 'embarrassing',
    inputType: 'long_text',
    emoji: '✅',
    question: {
      f: 'תכתבי משהו מצחיק או מביך שבאמת קרה לך',
      m: 'תכתוב משהו מצחיק או מביך שבאמת קרה לך',
    },
    helper: {
      f: 'יעבור אישור שלך לפני שיוצג. אם רגיש מדי — דלגי',
      m: 'יעבור אישור שלך לפני שיוצג. אם רגיש מדי — דלג',
    },
    placeholder: 'נפלתי באמצע ההצגה בבית ספר',
  },
  {
    id: 'lie',
    category: 'embarrassing',
    inputType: 'long_text',
    emoji: '🎭',
    question: {
      f: 'ועכשיו תמציאי משהו שנשמע אמיתי אבל שקרי',
      m: 'ועכשיו תמציא משהו שנשמע אמיתי אבל שקרי',
    },
    helper: 'משהו שאף אחד לא יידע אם זה אמת',
    placeholder: {
      f: 'אני יודעת לעשות סלטה אחורה',
      m: 'אני יודע לעשות סלטה אחורה',
    },
  },

  // ───────── סיום ─────────
  {
    id: 'wish_for_event',
    category: 'identity',
    inputType: 'long_text',
    emoji: '🌟',
    question: 'מה הכי חשוב לך שיקרה באירוע?',
    helper: 'משפט אחד. נשמור בסוד',
    placeholder: 'שכולם ירקדו ולא יעמדו בצד',
  },
];

export type WizardAnswers = Record<string, string | string[]>;

export function getAnswer(answers: WizardAnswers, id: string): string {
  const v = answers[id];
  if (Array.isArray(v)) return v.join(', ');
  return v ?? '';
}

export function getList(answers: WizardAnswers, id: string): string[] {
  const v = answers[id];
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    return v.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
