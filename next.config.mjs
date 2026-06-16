/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['framer-motion'],
    // `yt-search` ships a browserified bundle whose internal `require()` calls
    // (cheerio, etc.) webpack can't statically trace. Keep it external so Node
    // resolves it at runtime in our `/api/youtube/search` route.
    serverComponentsExternalPackages: ['yt-search'],
  },
};

export default nextConfig;
