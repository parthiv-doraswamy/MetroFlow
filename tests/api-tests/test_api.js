// MetroFlow REST API tests.
const BASE = `http://localhost:${process.env.PORT || 5187}`;
let pass = 0;
let fail = 0;

async function check(name, fn) {
  try { await fn(); console.log(`PASS: ${name}`); pass++; }
  catch (err) { console.log(`FAIL: ${name} — ${err.message}`); fail++; }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
async function get(path) {
  const res = await fetch(BASE + path);
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}
async function post(path, payload) {
  const res = await fetch(BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

(async () => {
  console.log('=== MetroFlow API tests ===');
  console.log('base:', BASE);

  await check('health returns 30 stations', async () => {
    const r = await get('/api/health');
    assert(r.status === 200 && r.body.status === 'ok');
    assert(r.body.stations === 30);
  });
  await check('stations returns 30 entries', async () => {
    const r = await get('/api/stations');
    assert(r.status === 200 && r.body.stations.length === 30);
  });
  await check('station search finds Central', async () => {
    const r = await get('/api/stations/search?q=central');
    assert(r.status === 200 && r.body.stations.some((s) => s.name === 'Central'));
  });
  await check('station details returns Skylink Airport', async () => {
    const r = await get('/api/stations/16');
    assert(r.status === 200 && r.body.station.name === 'Skylink Airport');
  });
  await check('unknown station returns 404', async () => {
    const r = await get('/api/stations/999');
    assert(r.status === 404);
  });
  await check('distance route uses Dijkstra', async () => {
    const r = await post('/api/route', { source: 1, destination: 16, mode: 'distance' });
    assert(r.status === 200 && r.body.mode === 'distance');
    assert(r.body.source === 'South Harbor' && r.body.destination === 'Skylink Airport');
    assert(Array.isArray(r.body.path) && r.body.path[0] === 1);
    assert(r.body.distance > 0 && r.body.travelTime > 0 && typeof r.body.fare === 'number');
  });
  await check('time route is supported', async () => {
    const r = await post('/api/route', { source: 1, destination: 16, mode: 'time' });
    assert(r.status === 200 && r.body.mode === 'time');
    assert(r.body.path.length > 1 && r.body.travelTime > 0);
  });
  await check('repeated route is served from cache', async () => {
    const first = await post('/api/route', { source: 2, destination: 29, mode: 'distance' });
    const second = await post('/api/route', { source: 2, destination: 29, mode: 'distance' });
    assert(first.status === 200 && first.body.cached === false);
    assert(second.status === 200 && second.body.cached === true);
  });
  await check('different routing modes have separate cache entries', async () => {
    const r = await post('/api/route', { source: 2, destination: 29, mode: 'time' });
    assert(r.status === 200 && r.body.mode === 'time' && r.body.cached === false);
  });
  await check('cross-line route reaches Eastside Terminus', async () => {
    const r = await post('/api/route', { source: 17, destination: 30 });
    assert(r.status === 200 && r.body.stations.includes('City Center'));
  });
  await check('same station returns one stop', async () => {
    const r = await post('/api/route', { source: 5, destination: 5 });
    assert(r.status === 200 && r.body.path.length === 1 && r.body.fare === 0);
  });
  await check('invalid route returns an error', async () => {
    const r = await post('/api/route', { source: 1, destination: 999 });
    assert(r.status === 404 || r.status === 422);
    assert(r.body.error);
  });
  await check('missing route body returns 400', async () => {
    const r = await post('/api/route', {});
    assert(r.status === 400 && /select both/i.test(r.body.error));
  });
  await check('nearby stations uses BFS', async () => {
    const r = await get('/api/stations/5/nearby?hops=2');
    assert(r.status === 200 && r.body.station === 'City Center');
    assert(r.body.nearbyStations.length > 0);
    assert(Math.max(...r.body.nearbyStations.map((n) => n.hops)) <= 2);
  });
  await check('nearby hops are capped', async () => {
    const r = await get('/api/stations/5/nearby?hops=99');
    assert(r.status === 200);
    assert(Math.max(...r.body.nearbyStations.map((n) => n.hops)) <= 6);
  });
  await check('network comes from the C++ engine', async () => {
    const r = await get('/api/network');
    assert(r.status === 200 && r.body.stations.length === 30 && r.body.edges.length > 0);
  });

  console.log(`\npassed: ${pass}, failed: ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((err) => { console.error('Test runner error:', err.message); process.exit(1); });
