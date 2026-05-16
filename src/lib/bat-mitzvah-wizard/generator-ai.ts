import { env, isOpenAIConfigured } from '@/lib/env';
import type { GameType } from '@/types/game';
import type { WizardAnswers } from './questions';
// Specs live in a pure-data file so this server-side generator doesn't drag
// the React component registry (and its 'use client' modules) into RSC.
import { GAME_SPECS } from '@/lib/game-engine/specs';
import type { GameAISpec } from '@/lib/game-engine/types';

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

// Each game's spec contributes its own detailed brief to the prompt so the
// model gets game-specific instructions instead of one giant generic ask.
// {שם} in the spec is substituted with the actual child name so the model
// returns the name verbatim instead of echoing the literal placeholder.
function gameBrief(type: GameType, spec: GameAISpec, childName: string): string {
  return `### משחק: ${type}
מטרה: ${spec.purpose}
מס׳ שאלות לייצור: ${spec.questionCount}
הצגה בבמה: ${spec.stageDisplay}
הצגה בטלפון: ${spec.playerDisplay}
הנחיות מפורטות:
${spec.instructions.replace(/\{שם\}/g, childName)}`;
}

function buildPrompt(childName: string, isFemale: boolean, profile: WizardAnswers): string {
  const genderNote = isFemale
    ? 'פנייה בנקבה: אוהבת, רוצה, תאכל, תרקוד, מאוהבת'
    : 'פנייה בזכר: אוהב, רוצה, יאכל, ירקוד, מאוהב';

  // Pull every game whose spec wants AI-generated content. Musical chairs has
  // questionCount: 0 so it's filtered out.
  const briefs = (Object.entries(GAME_SPECS) as Array<[GameType, GameAISpec]>)
    .filter(([, spec]) => spec.questionCount > 0)
    .map(([type, spec]) => gameBrief(type, spec, childName))
    .join('\n\n');

  return `אתה כותב/ת תוכן לשעשועון חי באירוע בת/בר מצווה. החוגג/ת מילא/ה שאלון אישי, ועליך לכתוב את כל השאלות והמשימות שיופיעו על המסך באירוע — מותאמות אישית, מצחיקות, אבל אף פעם לא משפילות.

חוגג/ת: ${childName}
סוג אירוע: ${isFemale ? 'בת מצווה' : 'בר מצווה'} (${genderNote})

הפרופיל המלא של החוגג/ת (תשובות מהשאלון):
${JSON.stringify(profile, null, 2)}

חוקים גלובליים (חלים על כל המשחקים):
1. **עברית טבעית של דור Z** — לא רשמית, לא מלאכותית, לא מוזרה. ניסוחים שילדים בני 12 משתמשים בהם.
2. **מגדר נכון בכל מילה** — אם זה בר מצווה, כל הפעלים והכינויים בזכר. אם בת — בנקבה.
3. **השתמש בתשובות האמיתיות** של החוגג/ת — צטט אותן, בנה עליהן, הרחב אותן.
4. **מצחיק אך טוב לב** — לעולם אל תהיה צינית/מעליבה/מבישה. הכל באהבה.
5. **ספציפי** — אל תכתוב שאלות גנריות. כל שאלה צריכה להרגיש שהיא נכתבה בדיוק לחוגג/ת הזה/זו.
6. **אל תתייחס לחוגג/ת בגוף שני במשימות** — המשימות ניתנות לאורחים אקראיים, לא לחוגג/ת.

עכשיו, ההוראות המפורטות לכל משחק:

${briefs}

החזר JSON תקני בלבד (ללא טקסט נוסף) במבנה הבא — מפתחות מתחת לכל סוג משחק:
{
  "true_or_false": [ { "text": "...", "is_true": true|false } ],
  "what_are_the_chances": [ { "text": "...", "expected_score": 1|2|3|4|5 } ],
  "what_happened_next": [ { "text": "...", "options": ["..","..","..",".."], "correct_index": 0-3 } ],
  "truth_or_lie": [ { "text": "${childName} ${isFemale ? 'מספרת' : 'מספר'}: \\"...\\"", "is_truth": true|false } ],
  "secret_missions": [ { "text": "..." } ]
}`;
}

// A complete-sounding mission/question has a verb, references *someone*, and
// is at least a few words long. The cheap heuristics here filter out the
// sentence fragments that occasionally show up if the model truncates.
function looksComplete(text: string | undefined, minChars: number): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < minChars) return false;
  // Reject obviously-fragment openings — Hebrew sentence-tail markers that
  // suggest the model dropped the start ("אז ...", "ותחגגו ...").
  if (/^(אז |ו[ת])/.test(trimmed) && trimmed.length < 40) return false;
  return true;
}

// Map the model's flat response into the canonical GeneratedQuestion shape.
function expand(ai: AIResponse): GeneratedQuestion[] {
  const out: GeneratedQuestion[] = [];

  ai.true_or_false?.forEach((q) => {
    if (!looksComplete(q.text, 10)) return;
    out.push({
      game_type: 'true_or_false',
      question_text: q.text,
      options: TRUE_FALSE_OPTS,
      correct_answer: q.is_true ? 'true' : 'false',
      config: {},
    });
  });

  ai.what_are_the_chances?.forEach((q) => {
    if (!looksComplete(q.text, 14)) return;
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
    if (!looksComplete(q.text, 14)) return;
    if (!q.options || q.options.length < 2) return;
    const validOptions = q.options.filter((label) => typeof label === 'string' && label.trim().length >= 3);
    if (validOptions.length < 2) return;
    const options = validOptions.map((label, i) => ({ id: String(i), label }));
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
    if (!looksComplete(q.text, 14)) return;
    out.push({
      game_type: 'truth_or_lie',
      question_text: q.text,
      options: TRUTH_LIE_OPTS,
      correct_answer: q.is_truth ? 'truth' : 'lie',
      config: {},
    });
  });

  ai.secret_missions?.forEach((q) => {
    if (!looksComplete(q.text, 25)) return;
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
        // ~30-40 questions × ~40 Hebrew tokens each + JSON scaffolding. The
        // default cap was clipping the response mid-mission, leaving
        // sentence fragments in the final card.
        max_tokens: 4000,
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
