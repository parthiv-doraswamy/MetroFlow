// metroRoutes.js — MetroFlow REST API routes.
// Every route answer originates from the C++ engine via services/engineBridge.js.
const express = require('express');
const { callEngine, enrichRoute } = require('../services/engineBridge');
const RouteCache = require('../services/routeCache');

const routeCache = new RouteCache(50);

const router = express.Router();

// GET /api/health
router.get('/health', async (req, res) => {
  try {
    const r = await callEngine({ operation: 'health' });
    res.json({ status: 'ok', engine: r.status || 'ok', stations: r.stations, edges: r.edges });
  } catch (err) {
    res.status(err.status || 503).json({ status: 'error', error: 'Route engine unavailable' });
  }
});

// GET /api/stations
router.get('/stations', async (req, res) => {
  try {
    const r = await callEngine({ operation: 'allStations' });
    res.json({ stations: r.stations || [] });
  } catch (err) {
    res.status(err.status || 503).json({ error: 'Unable to load stations' });
  }
});

// GET /api/stations/search?q=
router.get('/stations/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString();
    const r = await callEngine({ operation: 'search', q });
    res.json({ stations: r.stations || [] });
  } catch (err) {
    res.status(err.status || 503).json({ error: 'Search failed' });
  }
});

// GET /api/stations/:id/nearby?hops=2
router.get('/stations/:id/nearby', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  let hops = parseInt(req.query.hops || '2', 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid station id' });
  if (!Number.isFinite(hops) || hops < 1) hops = 1;
  if (hops > 6) hops = 6;
  try {
    const r = await callEngine({ operation: 'nearby', station: id, hops });
    if (!r.success) return res.status(404).json({ error: r.error || 'Station not found' });
    res.json({ station: r.station, stationId: r.stationId, nearbyStations: r.nearby || [] });
  } catch (err) {
    res.status(err.status || 503).json({ error: 'Unable to connect to route engine' });
  }
});

// GET /api/stations/:id
router.get('/stations/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid station id' });
  try {
    const r = await callEngine({ operation: 'station', id });
    if (!r.success) return res.status(404).json({ error: r.error || 'Station not found' });
    res.json({ station: r.station });
  } catch (err) {
    res.status(err.status || 503).json({ error: 'Unable to connect to route engine' });
  }
});

// POST /api/route { source, destination, mode }
router.post('/route', async (req, res) => {
  const source = parseInt(req.body && req.body.source, 10);
  const destination = parseInt(req.body && req.body.destination, 10);
  const mode = (req.body && req.body.mode) === 'time' ? 'time' : 'distance';
  if (!Number.isFinite(source) || !Number.isFinite(destination)) {
    return res.status(400).json({ error: 'Please select both stations.' });
  }

  const key = `${source}:${destination}:${mode}`;
  const cached = routeCache.get(key);
  if (cached) return res.json({ ...cached, cached: true });

  try {
    const r = await callEngine({ operation: 'shortestPath', source, destination, mode });
    if (!r.success) {
      const msg = r.error || 'No route available between these stations.';
      const code = /unknown|not found/i.test(msg) ? 404 : 422;
      return res.status(code).json({ error: msg });
    }
    const enriched = await enrichRoute(r);
    enriched.mode = mode;
    enriched.cached = false;
    routeCache.set(key, enriched);
    res.json(enriched);
  } catch (err) {
    res.status(err.status || 503).json({ error: 'Unable to connect to route engine' });
  }
});

// GET /api/network
router.get('/network', async (req, res) => {
  try {
    const r = await callEngine({ operation: 'network' });
    res.json({ stations: r.stations || [], edges: r.edges || [] });
  } catch (err) {
    res.status(err.status || 503).json({ error: 'Unable to load network' });
  }
});

module.exports = router;
