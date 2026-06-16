// Helpers used by both the API and the UI for the guest song-picker.

// Strip whitespace, lowercase, collapse multiple spaces.
// Used as the dedup key so "Espresso", " espresso ", "ESPRESSO" all group.
export function normalizeSongKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Parse a YouTube URL and return the video id (or null if not a YouTube URL).
// Supports youtu.be/<id>, youtube.com/watch?v=<id>, youtube.com/shorts/<id>,
// and m.youtube.com variants. Strips query params other than v.
export function parseYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (u.hostname.endsWith('youtube.com') || u.hostname.endsWith('m.youtube.com')) {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || null;
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] || null;
    }
    return null;
  } catch {
    return null;
  }
}
