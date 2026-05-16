import Link from 'next/link';
import { DEMO_EVENT_CODE } from '@/lib/env';

export default function HomePage() {
  return (
    <main className="stage-vignette min-h-screen flex items-center justify-center p-8">
      <div className="max-w-3xl w-full text-center space-y-10">
        <div className="space-y-3">
          <div className="chip mx-auto">
            <span className="size-2 rounded-full bg-success animate-pulse" />
            <span>אורל פליי · שעשועון חי</span>
          </div>
          <h1 className="font-display text-7xl md:text-8xl font-black gold-shimmer">OREL PLAY</h1>
          <p className="text-muted text-xl">שעשועון אינטראקטיבי לבת מצווה</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/admin" className="panel-strong p-6 text-right hover:scale-[1.02] transition-transform">
            <div className="text-gold text-sm font-bold mb-2">ניהול</div>
            <div className="text-xl font-bold mb-1">אדמין</div>
            <div className="text-muted text-sm">שליטה במשחק, ברכות, גלגל</div>
          </Link>
          <Link
            href={`/stage/${DEMO_EVENT_CODE}`}
            className="panel-strong p-6 text-right hover:scale-[1.02] transition-transform"
          >
            <div className="text-magenta text-sm font-bold mb-2">הקרנה</div>
            <div className="text-xl font-bold mb-1">מסך במה</div>
            <div className="text-muted text-sm">פתחו במסך גדול / כיוונו על הקיר</div>
          </Link>
          <Link
            href={`/join/${DEMO_EVENT_CODE}`}
            className="panel-strong p-6 text-right hover:scale-[1.02] transition-transform"
          >
            <div className="text-success text-sm font-bold mb-2">משתתפים</div>
            <div className="text-xl font-bold mb-1">הצטרפות</div>
            <div className="text-muted text-sm">מסך טלפון — סריקת QR</div>
          </Link>
        </div>

        <div className="text-muted text-sm">
          קוד אירוע דמו: <span className="text-gold font-bold tracking-widest">{DEMO_EVENT_CODE}</span>
        </div>
      </div>
    </main>
  );
}
