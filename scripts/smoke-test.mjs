// End-to-end smoke test against the running dev server.
// node scripts/smoke-test.mjs

const BASE = process.env.BASE || 'http://localhost:3000';
const log = (...a) => console.log(...a);
const truncate = (s, n) => (s.length > n ? s.slice(0, n) + '...' : s);

async function req(method, path, body) {
  const init = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) init.body = JSON.stringify(body);
  const r = await fetch(BASE + path, init);
  let data;
  try { data = await r.json(); } catch { data = null; }
  return { status: r.status, data };
}
const post = (p, b) => req('POST', p, b);
const patch = (p, b) => req('PATCH', p, b ?? {});
const get = (p) => req('GET', p);

(async () => {
  log('================================');
  log('[1] join 3 players');
  log('================================');
  const p1 = await post('/api/events/DEMO12/join', { display_name: 'Shira' });
  const p2 = await post('/api/events/DEMO12/join', { display_name: 'Yael' });
  const p3 = await post('/api/events/DEMO12/join', { display_name: 'Noa' });
  log(`  Shira -> ${p1.status} id=${p1.data.player.id.slice(0, 16)}`);
  log(`  Yael  -> ${p2.status} id=${p2.data.player.id.slice(0, 16)}`);
  log(`  Noa   -> ${p3.status} id=${p3.data.player.id.slice(0, 16)}`);

  log('\n================================');
  log('[2] greetings');
  log('================================');
  const greetingTests = [
    { token: p1.data.session_token, name: 'Shira', msg: 'Mazal tov Romi, you are the best!' },
    { token: p2.data.session_token, name: 'Yael',  msg: 'Such an amazing party' },
    { token: p3.data.session_token, name: 'Noa',   msg: 'Follow me on @noa.lifestyle for the photos' },
  ];
  for (const t of greetingTests) {
    const r = await post('/api/events/DEMO12/greetings', {
      session_token: t.token, display_name: t.name, message: t.msg,
    });
    log(`  ${t.name}: "${truncate(t.msg, 40)}" -> moderation=${r.data.moderation?.status}`);
  }

  log('\n================================');
  log('[3] admin snapshot');
  log('================================');
  const snap = await get('/api/events/DEMO12/admin-snapshot');
  log(`  players: ${snap.data.players.length}`);
  log(`  greetings total: ${snap.data.greetings.length}`);
  const pending = snap.data.greetings.filter(
    (g) => g.moderation_status === 'pending' || g.moderation_status === 'needs_review',
  );
  log(`  greetings pending review: ${pending.length}`);

  log('\n================================');
  log('[4] approve one greeting, reject one');
  log('================================');
  const approveTarget = pending.find((g) => g.message.includes('Mazal tov')) || pending[0];
  if (approveTarget) {
    const r = await post(`/api/greetings/${approveTarget.id}/approve`, {});
    log(`  approve "${truncate(approveTarget.message, 30)}" -> ${r.status} status=${r.data.greeting?.moderation_status}`);
  }
  const rejectTarget = pending.find((g) => g.message.includes('Follow me'));
  if (rejectTarget) {
    const r = await post(`/api/greetings/${rejectTarget.id}/reject`, { reason: 'external link' });
    log(`  reject  "${truncate(rejectTarget.message, 30)}" -> ${r.status} status=${r.data.greeting?.moderation_status}`);
  }

  log('\n================================');
  log('[5] transition to GREETINGS_WALL');
  log('================================');
  const ls1 = await post('/api/events/DEMO12/live-session', { stage_state: 'GREETINGS_WALL' });
  log(`  state -> ${ls1.data.liveSession.stage_state}`);
  const pub = await get('/api/events/DEMO12/snapshot');
  log(`  approvedGreetings going to stage: ${pub.data.approvedGreetings.length}`);
  pub.data.approvedGreetings.forEach((g) => log(`    - ${g.display_name}: ${g.message}`));

  log('\n================================');
  log('[6] wheel spin');
  log('================================');
  await post('/api/events/DEMO12/live-session', { stage_state: 'WHEEL_IDLE', wheel_status: 'idle' });
  const spin = await post('/api/events/DEMO12/wheel', {});
  log(`  spin -> ${spin.status} selected=${spin.data.selected?.title} (${spin.data.selected?.game_type})`);
  const stop = await patch('/api/events/DEMO12/wheel');
  log(`  wheel stop -> ${stop.status} state=${stop.data.liveSession.stage_state}`);

  log('\n================================');
  log('[7] start game (force true_or_false) + answers');
  log('================================');
  const games = pub.data.eventGames;
  const tof = games.find((g) => g.game_type === 'true_or_false');
  await post('/api/events/DEMO12/wheel', { override_game_id: tof.id });
  await patch('/api/events/DEMO12/wheel');
  const qres = await get(`/api/events/DEMO12/games/${tof.id}/questions`);
  log(`  questions for true_or_false: ${qres.data.questions.length}`);
  const firstQ = qres.data.questions[0];
  await post('/api/events/DEMO12/live-session', { stage_state: 'GAME_ACTIVE', active_question_id: firstQ.id });
  log(`  Q: "${firstQ.question_text}" (correct=${firstQ.correct_answer})`);

  const a1 = await post('/api/events/DEMO12/answers', { session_token: p1.data.session_token, answer_text: 'true', response_time_ms: 3200 });
  const a2 = await post('/api/events/DEMO12/answers', { session_token: p2.data.session_token, answer_text: 'true', response_time_ms: 4500 });
  const a3 = await post('/api/events/DEMO12/answers', { session_token: p3.data.session_token, answer_text: 'false', response_time_ms: 5800 });
  log(`  Shira true  -> ${a1.status} correct=${a1.data.answer?.is_correct} pts=${a1.data.answer?.points_awarded}`);
  log(`  Yael  true  -> ${a2.status} correct=${a2.data.answer?.is_correct} pts=${a2.data.answer?.points_awarded}`);
  log(`  Noa   false -> ${a3.status} correct=${a3.data.answer?.is_correct} pts=${a3.data.answer?.points_awarded}`);

  const dup = await post('/api/events/DEMO12/answers', { session_token: p1.data.session_token, answer_text: 'true', response_time_ms: 1000 });
  log(`  Shira double-answer -> ${dup.status} (expect 409)`);

  log('\n================================');
  log('[8] reveal results');
  log('================================');
  await post('/api/events/DEMO12/live-session', { stage_state: 'GAME_RESULTS' });
  const reveal = await get('/api/events/DEMO12/snapshot');
  log(`  state: ${reveal.data.liveSession.stage_state}`);
  log(`  answers tallied: ${reveal.data.activeGameAnswers.length}`);

  log('\n================================');
  log('[9] secret mission');
  log('================================');
  const secret = games.find((g) => g.game_type === 'secret_mission');
  const mission = await post('/api/events/DEMO12/missions', {
    event_game_id: secret.id,
    mission_text: 'Make the bat mitzvah girl smile for the camera',
  });
  log(`  assign mission -> ${mission.status} id=${mission.data.mission?.id?.slice(0, 20)}`);
  log(`  assigned to player: ${mission.data.mission?.assigned_to_player_id?.slice(0, 16)}`);
  const markSuccess = await patch('/api/events/DEMO12/missions', { mission_id: mission.data.mission.id, status: 'success' });
  log(`  mark success -> ${markSuccess.status} status=${markSuccess.data.mission?.status}`);

  log('\n================================');
  log('[10] moderation rule sanity');
  log('================================');
  const tests = [
    { msg: 'Mazal tov Romi',                       expect: 'needs_review' },
    { msg: 'fuck you',                              expect: 'rejected' },
    { msg: 'Call me at 050-1234567 please',         expect: 'rejected' },
    { msg: 'check out https://example.com/abc',     expect: 'rejected' },
    { msg: 'AAAAAAAAAA',                            expect: 'needs_review' },
    { msg: 'a',                                     expect: 'rejected' },
  ];
  for (const t of tests) {
    const r = await post('/api/moderate-greeting', { message: t.msg });
    const ok = r.data.status === t.expect ? 'OK ' : '?? ';
    log(`  ${ok} "${truncate(t.msg, 40)}" -> ${r.data.status} (expected ${t.expect})`);
  }

  log('\n================================');
  log('[11] create new event flow');
  log('================================');
  const newEvent = await post('/api/events', { name: 'Bar Mitzvah Test', child_name: 'Daniel' });
  log(`  create event -> ${newEvent.status} code=${newEvent.data.event?.event_code}`);
  if (newEvent.data.event) {
    const probeJoin = await get(`/api/events/${newEvent.data.event.event_code}/snapshot`);
    log(`  snapshot for new event -> ${probeJoin.status} games=${probeJoin.data.eventGames?.length}`);
  }

  log('\nALL DONE');
})().catch((e) => {
  console.error('SMOKE TEST FAILED:', e);
  process.exit(1);
});
