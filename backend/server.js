// server.js — MetroFlow Express backend.
// Serves the REST API and the static frontend. All routing math lives in C++.
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const metroRoutes = require('./routes/metroRoutes');

const app = express();
const PORT = parseInt(process.env.PORT || '5187', 10);

app.use(cors());
app.use(express.json());

// Static frontend (../frontend served at /).
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api', metroRoutes);

// Fallback: unknown API routes -> JSON 404 (never a stack trace).
app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API endpoint' }));

app.get('/route', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'route.html'));
});

app.listen(PORT,'0.0.0.0', () => {
  console.log(`MetroFlow backend listening on http://localhost:${PORT}`);
  console.log(`C++ engine: ${process.env.CPP_ENGINE_PATH || '../cpp-engine/build/metro_engine'}`);
});

module.exports = app;
