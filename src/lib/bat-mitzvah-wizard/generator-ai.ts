import { env, isOpenAIConfigured } from '@/lib/env';
import type { GameType } from '@/types/game';
import type { WizardAnswers } from './questions';

export interface GeneratedQuestion {
  game_type: GameType;
  question_text: string;
  options: Array<{ id: string; label: string }>;
  correct_answer: string | null;
  config: Record<string, unknown>;
}

const CHANCE_OPTS = [
  { id: '1', label: 'אין סיכוי' },
  { id: '2', label: 'אולי בקטנה' },
  { id: '3', label: 'יש מצב' },
  { id: '4', label: 'ברור שכן' },
  { id: '5', label: '100%' },
];

const TRUE_FALSE_OPTS = [
  { id: 'true', label: 'נכון' },
  { id: 'false', label: 'לא נכון' },
];

const TRUTH_LIE_OPTS = [
  { id: 'truth', label: 'אמת' },
  { id: 'lie', label: 'שקר' },
];

// What the model returns — narrower than GeneratedQuestion so the prompt is
// easier to constrain. We map this to GeneratedQuestion[] after parsing.
interface AIResponse {
  true_or_false: Array<{ text: string; is_true: boolean }>;
  what_are_the_chances: Array<{ text: string; expected_score: 1 | 2 | 3 | 4 | 5 }>;
  what_happened_next: Array<{ text: string; options: string[]; correct_index: number }>;
  truth_or_lie: Array<{ text: string; is_truth: boolean }>;
  secret_missions: Array<{ text: string }>;
}

function buildPrompt(childName: string, isFemale: boolean, profile: WizardAnswers): string {
  const genderNote = isFemale
    ? 'פנייה בנקבה: אוהבת, רוצה, תאכל, תרקוד, מאוהבת'
    : 'פנייה בזכר: אוהב, רוצה, יאכל, ירקוד, מאוהב';

  return `אתה כותב תוכן לשעשועון חי באירוע בת/בר מצווה. החוגג/ת מילא/ה שאלון אישי, ועליך לכתוב את כל השאלות והמשימות שיופיעו על המסך באירוע — מותאמות אישית, מצחיקות, אבל אף פעם לא משפילות.

חוגג/ת: ${childName}
סוג אירוע: ${isFemale ? 'בת מצווה' : 'בר מצווה'} (${genderNote})

הפרופיל המלא של החוגג/ת (תשובות מהשאלון):
${JSON.stringify(profile, null, 2)}

הנחיות קריטיות:
1. **עברית טבעית של דור Z** — לא רשמית, לא מלאכותית, לא מוזרה. ניסוחים שילדים בני 12 משתמשים בהם.
2. **מגדר נכון בכל מילה** — אם זה בר מצווה, כל הפעלים והכינויים בזכר. אם בת — בנקבה.
3. **השתמש בתשובות האמיתיות** של החוגג/ת — צטט אותן, בנה עליהן, הרחב אותן.
4. **מצחיק אך טוב לב** — לעולם אל תהיה צינית/מעליבה/מבישה. הכל באהבה.
5. **ספציפי** — אל תכתוב שאלות גנריות. כל שאלה צריכה להרגיש שהיא נכתבה בדיוק לחוגג/ת הזה/זו.
6. **משימות חייבות להיות אפשריות** באירוע אמיתי תוך 30 שניות (לא דורש ציוד מיוחד, לא מסוכן, חברתי, מצחיק).
7. **אל תתייחס לחוגג/ת בגוף שני** במשימות (אלא אם המשימה מיועדת ספציפית לחוגג/ת — וגם אז ניסוח עדין). המשימות ניתנות לאורחים אקראיים.

המבנה של JSON שאתה חייב להחזיר (ללא טקסט נוסף מחוץ ל-JSON):
{
  "true_or_false": [
    { "text": "<משפט על החוגג/ת>", "is_true": true|false }
    // ערבב נכון/לא נכון. ייצר 10-12 שאלות. חלק חייבות להיות "לא נכון" כדי שיהיה אתגר.
    // דוגמאות: "[שם] חולה על פיצה עם אננס" (אם זה באמת מהתשובות) או דברים מומצאים סבירים.
  ],
  "what_are_the_chances": [
    { "text": "מה הסיכוי ש[משפט]?", "expected_score": 1|2|3|4|5 }
    // 6-8 שאלות. צפי משוער של 1 (אין סיכוי) עד 5 (100%) לפי מה שאתה מבין על החוגג/ת.
    // התמקד בהתנהגות צפויה: "...יקום לרקוד ראשון/ה?", "...יעלה סטורי לפני שיאכל?"
  ],
  "what_happened_next": [
    { "text": "<קצה של סיפור>", "options": ["<א>","<ב>","<ג>","<ד>"], "correct_index": 0-3 }
    // 5-7 שאלות. השתמש ב-family_quirk, famous_quote, embarrassing_story מהפרופיל.
    // 4 אופציות, כולן סבירות, אחת היא הכי "${isFemale ? 'מתאימה' : 'מתאים'}" — הציון על האופציה הזו.
  ],
  "truth_or_lie": [
    { "text": "${childName} ${isFemale ? 'מספרת' : 'מספר'}: \\"<משפט>\\"", "is_truth": true|false }
    // 4-6 שאלות. השתמש בתשובות truth/lie של החוגג/ת + המצא עוד אמיתות/שקרים סבירים.
  ],
  "secret_missions": [
    { "text": "<משימה>" }
    // 8-10 משימות חמודות וביצועיות. ניסוח לאורח אקראי שיקבל את המשימה לטלפון.
    // דוגמה טובה: "לך לאדם הראשון שאתה רואה עם משקפיים ובקש ממנו לרקוד איתך 10 שניות"
    // דוגמה רעה: "תכנע שולחן" (לא ברור, לא ביצועי)
  ]
}`;
}

// Map the model's flat response into the canonical GeneratedQuestion shape.
function expand(ai: AIResponse): GeneratedQuestion[] {
  const out: GeneratedQuestion[] = [];

  ai.true_or_false?.forEach((q) => {
    out.push({
      game_type: 'true_or_false',
      question_text: q.text,
      options: TRUE_FALSE_OPTS,
      correct_answer: q.is_true ? 'true' : 'false',
      config: {},
    });
  });

  ai.what_are_the_chances?.forEach((q) => {
    const score = Math.max(1, Math.min(5, q.expected_score)) || 3;
    out.push({
      game_type: 'what_are_the_chances',
      question_text: q.text,
      options: CHANCE_OPTS,
      correct_answer: String(score),
      config: {},
    });
  });

  ai.what_happened_next?.forEach((q) => {
    if (!q.options || q.options.length < 2) return;
    const options = q.options.map((label, i) => ({ id: String(i), label }));
    const correctIdx = Math.max(0, Math.min(options.length - 1, q.correct_index ?? 0));
    out.push({
      game_type: 'what_happened_next',
      question_text: q.text,
      options,
      correct_answer: String(correctIdx),
      config: {},
    });
  });

  ai.truth_or_lie?.forEach((q) => {
    out.push({
      game_type: 'truth_or_lie',
      question_text: q.text,
      options: TRUTH_LIE_OPTS,
      correct_answer: q.is_truth ? 'truth' : 'lie',
      config: {},
    });
  });

  ai.secret_missions?.forEach((q) => {
    out.push({
      game_type: 'secret_mission',
      question_text: q.text,
      options: [],
      correct_answer: null,
      config: { timer_seconds: 30 },
    });
  });

  return out;
}

// Returns null on any failure (missing key, API error, bad JSON) so the caller
// can fall back to the deterministic template generator.
export async function generateQuestionsAI(
  childName: string,
  isFemale: boolean,
  profile: WizardAnswers,
): Promise<GeneratedQuestion[] | null> {
  if (!isOpenAIConfigured) return null;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.9, // creative but coherent
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You write Hebrew Bat/Bar Mitzvah game content. Output JSON only.' },
          { role: 'user', content: buildPrompt(childName, isFemale, profile) },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AIResponse>;
    const expanded = expand(parsed as AIResponse);
    return expanded.length > 0 ? expanded : null;
  } catch {
    return null;
  }
}
