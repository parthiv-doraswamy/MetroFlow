# MetroFlow backend

Express REST API for the MetroFlow C++ routing engine.

The backend keeps the web-facing logic in Node.js and delegates graph operations to the C++ executable. Route results are cached in a small in-memory LRU cache.

## Start

From the project root:

```bash
node backend/server.js
```

Or:

```bash
cd backend
npm install
npm start
```

## Environment

```env
PORT=5187
CPP_ENGINE_PATH=../cpp-engine/build/metro_engine
CPP_TIMEOUT_MS=5000
```

`CPP_ENGINE_PATH` can be set to an absolute path for deployment.
