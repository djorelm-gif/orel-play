'use client';

// Lightweight notification permission helper.
// Returns 'granted' | 'denied' | 'unsupported'. We store the chosen state on the
// server-side player record (notifications_opt_in) so the host UI can show a
// counter. Actual Web Push delivery (service worker + VAPID + push API) is a
// follow-up step — this file only handles asking permission.

export type PermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationState(): PermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as PermissionState;
}

export async function requestNotificationPermission(): Promise<PermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission as PermissionState;
  }
  try {
    const res = await Notification.requestPermission();
    return res as PermissionState;
  } catch {
    return 'denied';
  }
}

// Persist the player's choice on the server. If they opted IN and Web Push is
// available, also subscribe the browser and POST the subscription. Falls
// through silently on any failure — push is best-effort, the in-tab
// `notify(...)` fallback still works.
export async function persistNotificationOptIn(token: string, optIn: boolean): Promise<void> {
  await fetch('/api/players/me/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_token: token, opt_in: optIn }),
  }).catch(() => {
    /* ignore — non-critical */
  });
  if (optIn) {
    await subscribeToPush(token).catch(() => {
      /* ignore — falls back to in-tab notifications */
    });
  }
}

// Base64-url → Uint8Array (VAPID public key handed to pushManager.subscribe).
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

// Register the SW, ask for a Web Push subscription, send it to the server.
// Idempotent — if the browser already has a subscription we reuse it.
export async function subscribeToPush(token: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (!vapidPublic) return false;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    // Wait for the registration to be active before subscribing — first-time
    // installs can return a registration whose pushManager is not yet ready.
    if (!reg.active) {
      await new Promise<void>((resolve) => {
        const ready = reg.installing || reg.waiting;
        if (!ready) {
          resolve();
          return;
        }
        ready.addEventListener('statechange', () => {
          if (ready.state === 'activated') resolve();
        });
      });
    }
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      // The browser spec accepts ArrayBuffer / ArrayBufferView; cast to the
      // wider BufferSource union so newer TS lib.dom types don't complain
      // about SharedArrayBuffer-vs-ArrayBuffer narrowing.
      const key = urlBase64ToUint8Array(vapidPublic) as BufferSource;
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      });
    }
    await fetch('/api/players/me/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_token: token, subscription: sub.toJSON() }),
    });
    return true;
  } catch {
    return false;
  }
}

// Fire a system notification. Works while the tab is alive (foreground or
// backgrounded). For truly "phone closed" delivery we'd need Web Push, which is
// a follow-up. We dedupe with `tag` so polling won't spam the same alert.
export function notify(
  title: string,
  options: { body?: string; tag?: string; icon?: string } = {},
): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body: options.body,
      tag: options.tag,
      icon: options.icon ?? '/logo.svg',
      badge: options.icon ?? '/logo.svg',
      // @ts-expect-error vibrate is supported on Android but not in lib.dom types
      vibrate: [120, 60, 120],
    });
  } catch {
    /* user may have revoked permission, ignore */
  }
}
