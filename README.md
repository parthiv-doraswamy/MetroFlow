# MetroFlow

MetroFlow is a metro route planner built around a C++ graph engine, a small Node.js API, and a vanilla JavaScript frontend.

I built it incrementally: first the graph algorithms, then a CLI C++ engine, then the Node.js integration, and finally the web interface and route cache.

## Features

- Shortest-distance route using Dijkstra's algorithm
- Fastest-time route using the same Dijkstra implementation with time as the edge weight
- Nearby-station search using BFS
- Route distance, travel time and demo fare calculation
- Multiple metro lines and interchange stations
- SVG network map with the selected route highlighted
- In-memory LRU cache for repeated route requests
- REST API between the frontend and C++ engine

The metro network is fictional sample data for Meridian City and is not official transit data.

## Architecture

```text
Frontend (HTML/CSS/JavaScript)
              |
              v
       Node.js + Express
              |
        Route LRU Cache
              |
          cache miss
              v
        C++ Graph Engine
          /          \
     Dijkstra        BFS
```

The C++ executable accepts one JSON request on stdin and returns one JSON response on stdout. Node.js uses that interface for routing, station data and the network map.

## Algorithms

### Dijkstra

The metro network is stored as an adjacency list. A min-priority queue is used to select the next station with the smallest known cost.

- Distance mode: edge weight = distance
- Time mode: edge weight = travel time
- Complexity: `O((V + E) log V)`

The parent map is used to reconstruct the final station path.

### BFS

BFS is used for nearby stations when the user specifies a maximum number of stops (hops).

- Complexity: `O(V + E)`

### Route cache

The Node.js layer keeps up to 50 recent route results in an in-memory LRU cache. The cache key includes source, destination and routing mode.

## Project structure

```text
MetroFlow/
├── cpp-engine/
│   ├── include/
│   ├── src/
│   ├── data/
│   ├── CMakeLists.txt
│   └── Makefile
├── backend/
│   ├── routes/
│   ├── services/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── route.html
│   ├── css/
│   └── js/
├── tests/
├── Dockerfile
└── docker-compose.yml
```

## Run locally

### 1. Build the C++ engine

```bash
cd cpp-engine
mkdir -p build
cmake -S . -B build
cmake --build build
```

Or use:

```bash
make
```

### 2. Install backend dependencies

```bash
cd ../backend
npm install
```

### 3. Start MetroFlow

From the project root:

```bash
node backend/server.js
```

Open `http://localhost:5187`.

If the engine is in a different location, set `CPP_ENGINE_PATH`.

## API

```text
GET  /api/health
GET  /api/stations
GET  /api/stations/search?q=central
GET  /api/stations/:id
GET  /api/stations/:id/nearby?hops=2
GET  /api/network
POST /api/route
```

Route request:

```json
{
  "source": 1,
  "destination": 16,
  "mode": "distance"
}
```

`mode` can be `distance` or `time`.

## Tests

C++ engine tests:

```bash
bash tests/cpp-tests/test_engine.sh
```

API tests (with the backend running):

```bash
PORT=5100 node tests/api-tests/test_api.js
```

The API test suite covers routing, routing modes, caching, BFS, station lookup, network loading and error cases.

## Fare model

The fare calculation is only a simple demo model:

```text
0–5 km       ₹15
5–10 km      ₹25
10–15 km     ₹35
15–20 km     ₹45
20+ km       ₹55
```

## Docker

The included Dockerfile builds the C++ engine and runs the Node.js server in one container:

```bash
docker compose up --build
```

Then open `http://localhost:5187`.

## Future improvements

- Minimum-transfer routing
- Real-time transit data
- Persistent routing service instead of starting a C++ process per request
- Shared cache for multiple backend instances
