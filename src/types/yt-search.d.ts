// Minimal ambient declaration for the `yt-search` npm package, which ships
// no types of its own. We only use the default-callable form (`yts(query)`)
// inside the search route, so the surface here is intentionally tight — fields
// we don't read are typed as unknown so TS catches accidental drift.

declare module 'yt-search' {
  export interface YtsAuthor {
    name?: string;
    url?: string;
  }

  export interface YtsDuration {
    seconds?: number;
    timestamp?: string;
  }

  export interface YtsVideo {
    type?: 'video';
    videoId: string;
    title: string;
    description?: string;
    url?: string;
    image?: string;
    thumbnail?: string;
    seconds?: number;
    timestamp?: string;
    duration?: YtsDuration;
    ago?: string;
    views?: number;
    author?: YtsAuthor;
  }

  export interface YtsSearchResult {
    videos?: YtsVideo[];
    playlists?: unknown[];
    channels?: unknown[];
    live?: unknown[];
  }

  function yts(query: string): Promise<YtsSearchResult>;
  function yts(opts: { query: string; pageStart?: number; pageEnd?: number }): Promise<YtsSearchResult>;

  export default yts;
}
