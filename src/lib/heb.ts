// Minimal Hebrew gender helper. Use `t({ m, f })` to pick a string per gender.
import type { PlayerGender } from '@/types/player';

export function t(g: PlayerGender | null | undefined, both: { m: string; f: string }): string {
  // Default to masculine when gender unknown (industry-standard for Hebrew apps).
  if (g === 'female') return both.f;
  return both.m;
}

// "ניצחת" vs "ניצחה", "ענית" vs "ענתה" — short verb forms in past tense
export const verb = {
  joined: (g: PlayerGender | null | undefined) => t(g, { m: 'נכנסת', f: 'נכנסת' }), // both are spelled the same in 2nd-person past
  answered: (g: PlayerGender | null | undefined) => t(g, { m: 'ענית', f: 'ענית' }),
  won: (g: PlayerGender | null | undefined) => t(g, { m: 'ניצחת!', f: 'ניצחת!' }),
  correct: (g: PlayerGender | null | undefined) => t(g, { m: 'צדקת! 🎉', f: 'צדקת! 🎉' }),
  wrong: (g: PlayerGender | null | undefined) =>
    t(g, { m: 'לא נכון, אבל איזה כיף ששיחקת', f: 'לא נכון, אבל איזה כיף ששיחקת' }),
  eliminated: (g: PlayerGender | null | undefined) =>
    t(g, { m: 'הודחת. תודה שהשתתפת! 🎉', f: 'הודחת. תודה שהשתתפת! 🎉' }),
};

// Many Hebrew 2nd-person verbs are identical in masc/fem past ("נכנסת", "ענית"…).
// The bigger gender split is in IMPERATIVES ("תכתוב" vs "תכתבי") and PRESENT
// ("מקבל" vs "מקבלת"). Use this helper for those.
