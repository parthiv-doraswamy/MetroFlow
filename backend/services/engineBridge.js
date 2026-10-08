// engineBridge.js — Express-to-C++ bridge.
// Protocol: spawn engine binary, one JSON request on stdin, one JSON response on stdout.
// The backend keeps the engine boundary simple: one JSON request in, one JSON response out.
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function configuredEnginePath() {
  return process.env.CPP_ENGINE_PATH || '../cpp-engine/build/metro_engine';
}

function timeoutMs() {
  const t = parseInt(process.env.CPP_TIMEOUT_MS || '5000', 10);
  return Number.isFinite(t) && t > 0 ? t : 5000;
}

function resolveEnginePath() {
  const configured = configuredEnginePath();
  const candidates = [
    configured,
    path.join(__dirname, configured),
    path.join(__dirname, '..', '..', 'cpp-engine', 'build', 'metro_engine'),
    path.join(__dirname, '..', 'cpp-engine', 'build', 'metro_engine'),
    path.resolve(process.cwd(), 'cpp-engine/build/metro_engine'),
  ];
  for (const c of candidates) {
    try {
      const abs = path.isAbsolute(c) ? c : path.resolve(__dirname, c);
      fs.accessSync(abs, fs.constants.X_OK);
      return abs;
    } catch { /* try next */ }
  }
  return path.isAbsolute(configured) ? configured : path.resolve(__dirname, configured);
}

// Small in-memory station cache (60 s TTL). C++ stays the source of truth;
// on cache miss/failure we degrade to id-only labels rather than failing the route.
let stationCache = { at: 0, byId: new Map() };
const STATION_TTL_MS = 60 * 1000;

function callEngine(request) {
  const enginePath = resolveEnginePath();
  const timeout = timeoutMs();
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(enginePath, [], { stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (err) {
      return reject(Object.assign(new Error('Failed to launch route engine'), { status: 503 }));
    }

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { child.kill('SIGKILL'); } catch { /* ignore */ }
      const err = new Error('Route engine timed out');
      err.status = 504;
      reject(err);
    }, timeout);

    const fail = (message, status = 503) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const err = new Error(message);
      err.status = status;
      try { child.kill('SIGKILL'); } catch { /* ignore */ }
      reject(err);
    };

    child.on('error', (err) => {
      if (err && err.code === 'ENOENT') {
        fail('Route engine not found at ' + enginePath + '. Build it with: cd cpp-engine && make', 503);
      } else {
        fail('Unable to connect to route engine', 503);
      }
    });

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const text = stdout.trim();
      if (!text) {
        const err = new Error(stderr.trim() || 'Route engine returned no output');
        err.status = 503;
        return reject(err);
      }
      try {
        resolve(JSON.parse(text));
      } catch {
        const err = new Error('Route engine returned invalid data');
        err.status = 502;
        reject(err);
      }
    });

    try {
      child.stdin.write(JSON.stringify(request));
      child.stdin.end();
    } catch {
      fail('Failed to communicate with route engine', 503);
    }
  });
}

async function stationMap() {
  const now = Date.now();
  if (stationCache.byId.size && (now - stationCache.at) < STATION_TTL_MS) return stationCache.byId;
  const all = await callEngine({ operation: 'allStations' });
  stationCache = { at: now, byId: new Map((all.stations || []).map((s) => [s.id, s])) };
  return stationCache.byId;
}

async function enrichRoute(engineRes) {
  if (!engineRes || !engineRes.success) return engineRes;
  let byId = new Map();
  try {
    byId = await stationMap();
  } catch { byId = new Map(); }
  const idLabel = (id) => 'Station ' + id;
  const stations = (engineRes.path || []).map((id) => {
    const s = byId.get(id);
    return s ? { id: s.id, name: s.name, line: s.line } : { id, name: idLabel(id), line: 'Unknown' };
  });
  const legs = (engineRes.legs || []).map((leg) => ({
    from: leg.from,
    to: leg.to,
    distance: leg.distance,
    time: leg.time,
    fromName: (byId.get(leg.from) || {}).name || idLabel(leg.from),
    toName: (byId.get(leg.to) || {}).name || idLabel(leg.to),
  }));
  const source = stations[0] || null;
  const destination = stations[stations.length - 1] || null;
  const transfers = [];
  for (let i = 1; i < stations.length - 1; i++) {
    const incoming = (stations[i - 1].line || '').split('/');
    const at = (stations[i].line || '').split('/');
    const outgoing = (stations[i + 1].line || '').split('/');
    const fromLine = incoming.find((line) => at.includes(line));
    const toLine = outgoing.find((line) => at.includes(line));
    if (fromLine && toLine && fromLine !== toLine) {
      transfers.push({ station: stations[i].name, from: fromLine, to: toLine });
    }
  }
  return {
    success: true,
    source: source ? source.name : '',
    destination: destination ? destination.name : '',
    sourceId: source ? source.id : null,
    destinationId: destination ? destination.id : null,
    stations: stations.map((s) => s.name),
    stationDetails: stations,
    path: engineRes.path,
    legs,
    distance: engineRes.distance,
    travelTime: engineRes.time,
    fare: engineRes.fare,
    stops: engineRes.stops,
    transfers,
  };
}

module.exports = { callEngine, enrichRoute, resolveEnginePath };
