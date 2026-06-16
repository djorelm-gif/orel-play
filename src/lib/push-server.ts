import webpush, { type PushSubscription, type WebPushError } from 'web-push';
import { env, isWebPushConfigured } from '@/lib/env';
import { dataSource } from '@/lib/data-source';

export interface PushPayload {
  title: string;
  body?: string;
  tag?: string;
  url?: string;
  icon?: string;
  badge?: string;
}

let configured = false;
function configure(): boolean {
  if (configured) return true;
  if (!isWebPushConfigured) return false;
  webpush.setVapidDetails(env.vapidSubject, env.vapidPublicKey, env.vapidPrivateKey);
  configured = true;
  return true;
}

// Coerce whatever shape we have in jsonb into the strict PushSubscription
// the web-push library wants. Returns null if it doesn't look like one.
function toSubscription(raw: unknown): PushSubscription | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  if (typeof obj.endpoint !== 'string') return null;
  const keys = obj.keys;
  if (!keys || typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') return null;
  return { endpoint: obj.endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } };
}

async function deliver(
  playerId: string,
  sub: PushSubscription,
  payload: PushPayload,
): Promise<void> {
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
  } catch (err) {
    const status = (err as WebPushError).statusCode;
    // 404 unknown / 410 gone → endpoint is dead. Null it out so we stop
    // retrying every state change.
    if (status === 404 || status === 410) {
      try {
        await dataSource.updatePlayer(playerId, { push_subscription: null });
      } catch {
        /* ignore — non-fatal */
      }
    }
    // Other failures (network, 4xx, 5xx) are swallowed: push is best-effort,
    // we never want a transient delivery error to crash a stage change.
  }
}

// Fan out a push to every opted-in player on this event whose browser handed
// us a valid subscription.
export async function pushToEvent(eventId: string, payload: PushPayload): Promise<void> {
  if (!configure()) return;
  const players = await dataSource.listPlayers(eventId);
  await Promise.all(
    players.map(async (p) => {
      if (p.status !== 'active') return;
      const sub = toSubscription(p.push_subscription);
      if (!sub) return;
      await deliver(p.id, sub, payload);
    }),
  );
}

// Send a push to a single player by id. Used for assigned secret missions.
export async function pushToPlayer(playerId: string, payload: PushPayload): Promise<void> {
  if (!configure()) return;
  const player = await dataSource.getPlayerById(playerId);
  if (!player) return;
  const sub = toSubscription(player.push_subscription);
  if (!sub) return;
  await deliver(player.id, sub, payload);
}

/**
 * iOS NOTE for the host: Apple only delivers Web Push to a site that has been
 * installed to the home screen as a PWA. Android Chrome works without install.
 */
