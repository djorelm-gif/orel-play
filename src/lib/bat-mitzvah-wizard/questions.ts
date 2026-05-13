// The wizard interview script — questions the Bat Mitzvah girl answers about herself.
// Each prompt has a category that maps to one or more game types when generated.

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
  | 'list'        // comma-separated list, up to N items
  | 'choice'      // pick one of presets
  | 'multi_choice'
  | 'truth_lie';  // one truth + one lie (drives the תשובה אמיתית או שקר game)

export interface WizardPrompt {
  id: string;
  category: WizardCategory;
  inputType: WizardInputType;
  emoji: string;
  question: string;       // what the girl sees
  helper?: string;        // gentle subtitle / example
  placeholder?: string;
  options?: string[];     // for choice / multi_choice
  maxItems?: number;      // for list
  required?: boolean;
}

// Ordered: gentle warmup → quirky → bolder.
export const WIZARD_PROMPTS: WizardPrompt[] = [
  // ───────── זהות / חימום ─────────
  {
    id: 'nickname',
    category: 'identity',
    inputType: 'short_text',
    emoji: '✨',
    question: 'איך קוראים לך החברות?',
    helper: 'אם יש לך כינוי או קיצור — זה הזמן',
    placeholder: 'לדוגמה: רומיק / ר',
  },
  {
    id: 'three_words',
    category: 'identity',
    inputType: 'list',
    emoji: '🎯',
    question: 'תכתבי 3 מילים שמתארות אותך',
    helper: 'מצחיקה? עקשנית? חולת ריקודים? תהיי כנה',
    placeholder: 'מצחיקה, אנרגטית, דרמטית',
    maxItems: 3,
    required: true,
  },

  // ───────── אוכל ─────────
  {
    id: 'favorite_food',
    category: 'food',
    inputType: 'short_text',
    emoji: '🍕',
    question: 'מה האוכל האהוב עלייך בעולם?',
    helper: 'משהו אחד, האולטימטיבי',
    placeholder: 'פיצה עם אננס',
    required: true,
  },
  {
    id: 'hate_food',
    category: 'food',
    inputType: 'short_text',
    emoji: '🤢',
    question: 'מה את הכי שונאת לאכול?',
    helper: 'לא נשפוט. כמעט',
    placeholder: 'גזר מבושל',
    required: true,
  },
  {
    id: 'breakfast_habit',
    category: 'food',
    inputType: 'choice',
    emoji: '🥐',
    question: 'מה את בדרך כלל אוכלת בבוקר?',
    options: ['כלום, מוותרת', 'פיתה עם נוטלה', 'דייסה / קורנפלקס', 'משהו מלוח', 'תלוי במצב רוח'],
  },

  // ───────── חברה / משפחה ─────────
  {
    id: 'best_friend',
    category: 'social',
    inputType: 'short_text',
    emoji: '💛',
    question: 'מי החברה הכי טובה שלך?',
    helper: 'נקרא לה ככה במשחק. אם יש כמה, הראשונה שעולה לראש',
    placeholder: 'נועה',
    required: true,
  },
  {
    id: 'family_quirk',
    category: 'family',
    inputType: 'long_text',
    emoji: '👨‍👩‍👧',
    question: 'מה הדבר הכי מצחיק שמישהו במשפחה שלך עושה?',
    helper: 'אבא מנגן גיטרה ושר רע? אמא רוקדת לטיקטוק? סבתא מדברת ברוסית? תכתבי משפט',
    placeholder: 'אבא מנסה לרקוד תמיד וזה זוועה',
  },

  // ───────── הרגלים / קוויקים ─────────
  {
    id: 'phone_time',
    category: 'habits',
    inputType: 'choice',
    emoji: '📱',
    question: 'כמה זמן את בטלפון ביום?',
    options: ['פחות משעה', '1-3 שעות', '3-5 שעות', '5-8 שעות', 'הוא חלק מהיד שלי'],
  },
  {
    id: 'tiktok_habit',
    category: 'habits',
    inputType: 'choice',
    emoji: '🎵',
    question: 'את מצלמת טיקטוקים?',
    options: ['בחיים לא', 'לפעמים בסתר', 'מצלמת אבל לא מעלה', 'מעלה כל יום', 'אני INFLUENCER'],
  },
  {
    id: 'famous_quote',
    category: 'habits',
    inputType: 'short_text',
    emoji: '🗣️',
    question: 'מה המשפט שאת אומרת הכי הרבה?',
    helper: 'משהו שכולם מזהים — "ברצינות?", "אין מצב", "וואלה" וכו',
    placeholder: 'אין מצב!',
  },
  {
    id: 'morning_struggle',
    category: 'habits',
    inputType: 'choice',
    emoji: '🛏️',
    question: 'כשאמא מעירה אותך בבוקר את:',
    options: [
      'קופצת מיד',
      'אומרת "עוד 5 דקות"',
      'מתחבאת מתחת לשמיכה',
      'עונה בסינית',
      'צריך להעיר אותי 4 פעמים',
    ],
  },

  // ───────── תרבות פופ ─────────
  {
    id: 'favorite_song',
    category: 'pop_culture',
    inputType: 'short_text',
    emoji: '🎤',
    question: 'השיר שאת חייבת לרקוד עליו באירוע?',
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
    question: 'על איזה ידוען/ת היית מתעלפת אם הייתי פוגשת במציאות?',
    helper: 'אל תתביישי, גם החברות יודעות',
    placeholder: 'טימותי שלאמה',
  },

  // ───────── חלומות ─────────
  {
    id: 'dream_job',
    category: 'dreams',
    inputType: 'short_text',
    emoji: '🚀',
    question: 'מה את רוצה להיות כשתגדלי?',
    placeholder: 'רופאה / יוצרת תוכן / בלי מושג',
  },
  {
    id: 'travel_dream',
    category: 'dreams',
    inputType: 'short_text',
    emoji: '✈️',
    question: 'לאן את הכי רוצה לטוס בעולם?',
    placeholder: 'יפן',
  },

  // ───────── אמת או שקר ─────────
  {
    id: 'truth',
    category: 'embarrassing',
    inputType: 'long_text',
    emoji: '✅',
    question: 'תכתבי משהו מצחיק או מביך שבאמת קרה לך',
    helper: 'יעבור אישור שלך לפני שיוצג. אם רגיש מדי — דלגי',
    placeholder: 'נפלתי באמצע ההצגה בבית ספר',
  },
  {
    id: 'lie',
    category: 'embarrassing',
    inputType: 'long_text',
    emoji: '🎭',
    question: 'ועכשיו תמציאי משהו שנשמע אמיתי אבל שקרי',
    helper: 'משהו שאף אחד לא יידע אם זה אמת',
    placeholder: 'אני יודעת לעשות סלטה אחורה',
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
