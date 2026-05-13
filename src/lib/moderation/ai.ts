import type { ModerationResult } from '@/types/greeting';
import { env, isOpenAIConfigured } from '@/lib/env';
import { heuristicModerate } from './heuristic';

const SYSTEM_PROMPT = `You are moderating short Hebrew greetings written by children at a Bat Mitzvah event. Decide whether the greeting is safe to show on a large public screen.
Reject or flag anything insulting, humiliating, sexual, violent, hateful, too personal, embarrassing, spammy, or containing private contact info.
Keep the tone fun and age-appropriate.
Return strict JSON only:
{
  "status": "approved" | "rejected" | "needs_review",
  "safeMessage": "<the original message, lightly cleaned if needed>",
  "reason": "<short Hebrew reason>"
}`;

export async function moderateWithAI(message: string): Promise<ModerationResult> {
  // Always run heuristic first — cheap defense in depth.
  const local = heuristicModerate(message);
  if (local.status === 'rejected') return local;

  if (!isOpenAIConfigured) return local;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Message: ${message}` },
        ],
      }),
    });

    if (!res.ok) return { ...local, status: 'needs_review', reason: 'AI לא זמין — נדרש אישור ידני' };

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return { ...local, status: 'needs_review', reason: 'תשובה ריקה מ-AI' };

    const parsed = JSON.parse(raw) as Partial<ModerationResult>;
    const status =
      parsed.status === 'approved' || parsed.status === 'rejected' || parsed.status === 'needs_review'
        ? parsed.status
        : 'needs_review';
    return {
      status,
      safeMessage: parsed.safeMessage || message,
      reason: parsed.reason || 'בדיקת AI',
    };
  } catch {
    return { ...local, status: 'needs_review', reason: 'AI נכשל — נדרש אישור ידני' };
  }
}
