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

// Persist the player's choice on the server (no Web Push subscription yet — that
// is a TODO once we wire up VAPID + a service worker).
export async function persistNotificationOptIn(token: string, optIn: boolean): Promise<void> {
  await fetch('/api/players/me/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_token: token, opt_in: optIn }),
  }).catch(() => {
    /* ignore — non-critical */
  });
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
