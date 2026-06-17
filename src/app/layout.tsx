import type { Metadata, Viewport } from 'next';
import { Heebo, Suez_One, Bellefair, Karantina } from 'next/font/google';
import './globals.css';

// Body — clean modern Hebrew sans. Stays as Heebo.
const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
  weight: ['400', '500', '700', '900'],
});

// Display — Suez One is a distinctive Hebrew slab with real weight and
// personality. Replaces the generic Rubik so big stage headlines and
// counters feel hand-drawn and luxurious, not template-AI.
const suezOne = Suez_One({
  subsets: ['hebrew', 'latin'],
  variable: '--font-rubik', // keep the CSS variable name; just swap the family
  display: 'swap',
  weight: ['400'],
});

// Editorial — Bellefair is a slim, elegant editorial serif (Vogue/Cartier vibe)
// used for hero text on the stage, the wizard intro, and FinalScreen.
const bellefair = Bellefair({
  subsets: ['hebrew', 'latin'],
  variable: '--font-editorial',
  display: 'swap',
  weight: ['400'],
});

// Accent display — Karantina is a distinctive handcrafted Hebrew display
// font with serious character. Used sparingly for chips, "winner" labels,
// and a few hero accents to add depth to the type system.
const karantina = Karantina({
  subsets: ['hebrew', 'latin'],
  variable: '--font-accent',
  display: 'swap',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'אורל פרודקשנס',
  description: 'שעשועון אינטראקטיבי לבת/בר מצווה — סורקים, נכנסים, משחקים.',
  applicationName: 'אורל פליי',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    // The iOS Add-to-Home-Screen treatment: when a guest installs the site
    // as a PWA, Safari uses this title under the icon and runs the page in
    // standalone (no browser chrome), which is the only mode where Apple
    // delivers Web Push notifications when the screen is off.
    capable: true,
    title: 'אורל פליי',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', sizes: '512x512' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#050506',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${suezOne.variable} ${bellefair.variable} ${karantina.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
