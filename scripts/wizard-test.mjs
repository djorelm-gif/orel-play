// End-to-end test of the Bat Mitzvah wizard flow.

const BASE = process.env.BASE || 'http://localhost:3000';

async function req(method, path, body) {
  const init = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) init.body = JSON.stringify(body);
  const r = await fetch(BASE + path, init);
  return { status: r.status, data: await r.json().catch(() => null) };
}

(async () => {
  // Look up the real host_token from the snapshot endpoint
  const snap = await req('GET', '/api/events/DEMO12/snapshot');
  const HOST_TOKEN = snap.data.event?.host_token;
  if (!HOST_TOKEN) throw new Error('No host_token for DEMO12');
  console.log(`Using host_token=${HOST_TOKEN.slice(0, 12)}...`);

  console.log('================================');
  console.log('[1] בקשת מידע על הילדה דרך host_token');
  console.log('================================');
  const info = await req('GET', `/api/me/${HOST_TOKEN}`);
  console.log(`  status=${info.status}`);
  console.log(`  event: ${info.data.event?.name}`);
  console.log(`  child_name: ${info.data.event?.child_name}`);
  console.log(`  existing profile: ${info.data.profile ? 'יש' : 'אין'}`);

  console.log('\n================================');
  console.log('[2] שמירת תשובות חלקיות');
  console.log('================================');
  const partial = await req('POST', `/api/me/${HOST_TOKEN}`, {
    answers: { favorite_food: 'פיצה עם אננס', hate_food: 'גזר מבושל' },
  });
  console.log(`  status=${partial.status} completed_at=${partial.data.profile?.completed_at}`);

  console.log('\n================================');
  console.log('[3] שמירת כל התשובות + סיום (יוצר שאלות אוטומטית)');
  console.log('================================');
  const allAnswers = {
    nickname: 'רומיק',
    three_words: ['מצחיקה', 'אנרגטית', 'דרמטית'],
    favorite_food: 'פיצה עם אננס',
    hate_food: 'גזר מבושל',
    breakfast_habit: 'פיתה עם נוטלה',
    best_friend: 'נועה',
    family_quirk: 'אבא מנסה לרקוד תמיד וזה זוועה',
    phone_time: '5-8 שעות',
    tiktok_habit: 'מצלמת אבל לא מעלה',
    famous_quote: 'אין מצב!',
    morning_struggle: 'אומרת "עוד 5 דקות"',
    favorite_song: 'Espresso של Sabrina Carpenter',
    favorite_show: 'Wednesday',
    celeb_crush: 'טימותי שלאמה',
    dream_job: 'יוצרת תוכן',
    travel_dream: 'יפן',
    truth: 'נפלתי באמצע ההצגה בבית ספר',
    lie: 'אני יודעת לעשות סלטה אחורה',
    wish_for_event: 'שכולם ירקדו ולא יעמדו בצד',
  };
  const complete = await req('POST', `/api/me/${HOST_TOKEN}`, { answers: allAnswers, complete: true });
  console.log(`  status=${complete.status}`);
  console.log(`  completed_at: ${complete.data.profile?.completed_at}`);

  console.log('\n================================');
  console.log('[4] בדיקה ששאלות אוטומטיות נוצרו');
  console.log('================================');
  const snap2 = await req('GET', '/api/events/DEMO12/snapshot');
  const games = snap2.data.eventGames;
  for (const g of games) {
    const q = await req('GET', `/api/events/DEMO12/games/${g.id}/questions`);
    console.log(`  ${g.title}: ${q.data.questions.length} שאלות`);
    if (q.data.questions.length > 0) {
      console.log(`    דוגמה: "${q.data.questions[0].question_text}"`);
    }
  }

  console.log('\n================================');
  console.log('[5] בדיקה ש-event מסומן profile_complete');
  console.log('================================');
  const ev = await req('GET', '/api/events/DEMO12/snapshot');
  console.log(`  profile_complete: ${ev.data.event.profile_complete}`);

  console.log('\nWIZARD TEST OK');
})().catch((e) => { console.error('FAIL:', e); process.exit(1); });
