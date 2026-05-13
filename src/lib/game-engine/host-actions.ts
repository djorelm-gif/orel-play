// Tiny client wrapper used by host control components.
// Lives here so we don't repeat the fetch URL in every game module.

export async function patchLiveSession(eventCode: string, patch: Record<string, unknown>) {
  const res = await fetch(`/api/events/${eventCode}/live-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function spinWheel(eventCode: string, overrideGameId?: string) {
  const res = await fetch(`/api/events/${eventCode}/wheel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ override_game_id: overrideGameId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function confirmWheelStop(eventCode: string) {
  const res = await fetch(`/api/events/${eventCode}/wheel`, { method: 'PATCH' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function approveGreeting(id: string, editedMessage?: string) {
  const res = await fetch(`/api/greetings/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ editedMessage }),
  });
  return res.json();
}

export async function rejectGreeting(id: string, reason?: string) {
  const res = await fetch(`/api/greetings/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  return res.json();
}

export async function toggleGame(eventCode: string, gameId: string, patch: { is_enabled?: boolean; wheel_weight?: number }) {
  const res = await fetch(`/api/events/${eventCode}/games/${gameId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return res.json();
}

export async function assignMission(eventCode: string, payload: { mission_text: string; event_game_id: string; target_player_id?: string }) {
  const res = await fetch(`/api/events/${eventCode}/missions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateMission(eventCode: string, payload: { mission_id: string; status: 'success' | 'fail'; result?: string }) {
  const res = await fetch(`/api/events/${eventCode}/missions`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}
