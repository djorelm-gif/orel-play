import type { ModerationResult } from '@/types/greeting';

// Hebrew + Latin profanity / unsafe patterns. Conservative — when in doubt, send to needs_review.
const BLOCK = [
  // Hebrew profanity & insults (partial — extend as needed)
  'שרמוטה', 'זונה', 'בן זונה', 'בת זונה', 'כוס אמא', 'כוסאמק', 'מניאק', 'מטומטם', 'מטומטמת',
  'דביל', 'דבילית', 'הומו', 'לסבית', 'אידיוט', 'אידיוטית', 'נאצי', 'מסטול',
  // Latin
  'fuck', 'shit', 'bitch', 'cunt', 'nigger', 'faggot', 'porn', 'sex',
];

const REVIEW = [
  // body / appearance / weight
  'שמן', 'שמנה', 'מכוער', 'מכוערת', 'fat', 'ugly',
  // romantic / mature
  'מאוהב', 'מאוהבת', 'אוהבת אותו', 'אוהב אותה',
];

const URL_REGEX = /(https?:\/\/|www\.|\b[a-z0-9.-]+\.(com|net|co\.il|org|app|io)\b)/i;
const PHONE_REGEX = /(?:\+?\d[\s-]?){7,}/;
const INSTAGRAM_REGEX = /@[a-z0-9._]{3,}/i;
const REPEAT_REGEX = /(.)\1{6,}/; // 7+ identical chars in a row
const ALL_CAPS_LATIN = /^[A-Z\s!?.,]{8,}$/;

export function heuristicModerate(message: string): ModerationResult {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  if (trimmed.length < 2) {
    return { status: 'rejected', safeMessage: trimmed, reason: 'הודעה קצרה מדי' };
  }
  if (trimmed.length > 280) {
    return { status: 'needs_review', safeMessage: trimmed.slice(0, 280), reason: 'הודעה ארוכה — נדרש אישור ידני' };
  }

  for (const word of BLOCK) {
    if (lower.includes(word.toLowerCase())) {
      return { status: 'rejected', safeMessage: trimmed, reason: 'תוכן לא ראוי' };
    }
  }

  if (URL_REGEX.test(trimmed) || INSTAGRAM_REGEX.test(trimmed)) {
    return { status: 'rejected', safeMessage: trimmed, reason: 'אסור לשלוח קישורים או חשבונות' };
  }

  if (PHONE_REGEX.test(trimmed)) {
    return { status: 'rejected', safeMessage: trimmed, reason: 'אסור לשתף מספרי טלפון' };
  }

  if (REPEAT_REGEX.test(trimmed) || ALL_CAPS_LATIN.test(trimmed)) {
    return { status: 'needs_review', safeMessage: trimmed, reason: 'ספאם פוטנציאלי — נדרש אישור' };
  }

  for (const word of REVIEW) {
    if (lower.includes(word.toLowerCase())) {
      return { status: 'needs_review', safeMessage: trimmed, reason: 'נדרשת בדיקה ידנית' };
    }
  }

  return { status: 'approved', safeMessage: trimmed, reason: 'עבר בדיקה אוטומטית' };
}
