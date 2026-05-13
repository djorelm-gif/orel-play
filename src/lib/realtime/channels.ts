// Channel name helpers — keeps subscribers and publishers in sync.
export const channels = {
  event: (eventId: string) => `event:${eventId}`,
  liveSession: (eventId: string) => `live:${eventId}`,
  players: (eventId: string) => `players:${eventId}`,
  greetings: (eventId: string) => `greetings:${eventId}`,
};
