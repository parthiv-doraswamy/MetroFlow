# MetroFlow 🚇

A full-stack metro route planner built around a **C++ graph engine**, a **Node.js/Express API**, and a lightweight **HTML/CSS/JavaScript frontend**.

MetroFlow models a fictional metro network for **Meridian City** and demonstrates how graph algorithms can power a real-world route-planning application.

> **Note:** The metro stations, routes, fares, and network data are fictional demo data and are not official transit information.

**Live Demo:** https://metroflow-xoen.onrender.com

---

## ✨ Features

- 🚉 Station search with autocomplete
- 🧭 Shortest-distance route planning
- ⚡ Fastest-time route planning
- 🗺️ Interactive SVG metro network map
- 📍 Route highlighting on the network
- 🔄 Interchange and transfer detection
- 📊 Distance, travel time, stops, and fare information
- 🔎 Nearby-station discovery using BFS
- 💾 Manual in-memory LRU cache for repeated route requests
- 🔌 JSON communication between Node.js and the C++ engine
- 🐳 Docker and Docker Compose support
- ☁️ Render deployment

---

## 🧱 Architecture

~~~text
┌──────────────────────────────────────────────┐
│                  Frontend                    │
│          HTML + CSS + JavaScript             │
│                                              │
│ Planner · Search · Route Details · Map       │
└──────────────────────┬───────────────────────┘
                       │ REST / JSON
                       ▼
┌──────────────────────────────────────────────┐
│              Node.js + Express               │
│                                              │
│ API Routes · Validation · Enrichment         │
│ Manual LRU Cache · C++ Engine Bridge        │
└──────────────────────┬───────────────────────┘
                       │ cache miss
                       ▼
┌──────────────────────────────────────────────┐
│                C++ Engine                    │
│                                              │
│ Graph · Dijkstra · BFS · Fare Calculation   │
│ Station Data · Network Data                 │
└──────────────────────────────────────────────┘
~~~

### Route request flow

1. The frontend sends source, destination, and routing mode to Express.
2. Node.js checks the in-memory LRU cache.
3. On a cache hit, the stored result is returned immediately.
4. On a cache miss, Node.js launches the C++ executable.
5. A JSON request is written to the C++ process through stdin.
6. The C++ engine runs Dijkstra on the weighted graph.
7. The engine returns a JSON response through stdout.
8. Node.js enriches the result with station names, lines, and transfers.
9. The frontend renders the route and highlights it on the network map.

---

## 🧠 Algorithms

### Dijkstra's Algorithm

The metro network is represented using an **adjacency list**.

Each edge stores:

- Distance
- Travel time

The same Dijkstra implementation supports two routing modes:

| Mode | Edge Weight |
|---|---|
| Shortest route | Distance |
| Fastest route | Travel time |

A C++ priority queue is used as the min-heap.

**Complexity:** O((V + E) log V)

Parent pointers are maintained so the complete station path can be reconstructed after reaching the destination.

### BFS — Nearby Stations

Breadth-First Search is used for the nearby-station feature.

BFS measures the number of station-to-station hops from the selected station.

**Complexity:** O(V + E)

### LRU Route Cache

The Node.js backend contains a small manual **in-memory LRU cache**.

- Capacity: 50 route results
- Cache key: source + destination + routing mode
- Avoids repeated C++ calculations for identical requests
- No Redis or external cache dependency

The cache is intentionally simple because MetroFlow is currently a single-service application.

---

## 🗺️ Metro Network

The current fictional network contains:

- **30 stations**
- **34 undirected connections**
- **4 metro lines**
  - Blue
  - Green
  - Red
  - Yellow
- Multiple interchange stations

The graph data lives in:

~~~text
cpp-engine/data/metro_data.json
~~~

The **C++ engine is the source of truth for routing**.

The frontend network map consumes the network through the API and renders the topology using SVG. A small visual fallback topology is also available so a temporary network API failure does not leave the map blank.

---

## 💰 Demo Fare Model

Fares are calculated from total route distance.

| Distance | Demo Fare |
|---|---:|
| 0–5 km | ₹15 |
| 5–10 km | ₹25 |
| 10–15 km | ₹35 |
| 15–20 km | ₹45 |
| 20+ km | ₹55 |

This is a demonstration model only and does not represent a real transit authority's pricing.

---

## 📡 REST API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/health | Engine and network health |
| GET | /api/stations | All stations |
| GET | /api/stations/search?q=central | Search stations |
| GET | /api/stations/:id | Station details |
| GET | /api/stations/:id/nearby?hops=2 | Nearby stations using BFS |
| GET | /api/network | Network stations and edges |
| POST | /api/route | Calculate a route |

### Route request

~~~json
{
  "source": 1,
  "destination": 16,
  "mode": "distance"
}
~~~

Supported modes:

- distance — shortest route by distance
- time — fastest route by travel time

---

## 📁 Project Structure

~~~text
MetroFlow/
│
├── cpp-engine/
│   ├── include/
│   │   ├── Graph.h
│   │   ├── Json.h
│   │   ├── Route.h
│   │   └── Station.h
│   ├── src/
│   │   ├── main.cpp
│   │   ├── Graph.cpp
│   │   ├── Json.cpp
│   │   ├── Route.cpp
│   │   └── Station.cpp
│   ├── data/
│   │   └── metro_data.json
│   ├── CMakeLists.txt
│   └── Makefile
│
├── backend/
│   ├── routes/
│   │   └── metroRoutes.js
│   ├── services/
│   │   ├── cppEngine.js
│   │   ├── engineBridge.js
│   │   └── routeCache.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── api.js
│   │   ├── app.js
│   │   ├── network.js
│   │   └── route.js
│   ├── index.html
│   └── route.html
│
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
└── README.md
~~~

---

## 🛠️ Tech Stack

### Core / Algorithms
- C++17
- Graphs
- Adjacency lists
- Dijkstra's algorithm
- Breadth-First Search
- STL priority queue
- STL queue
- STL unordered map

### Backend
- Node.js
- Express.js
- REST API
- JSON
- Child-process based C++ integration
- Manual LRU caching

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- SVG-based network visualization

### Build & Deployment
- CMake
- Make
- Docker
- Docker Compose
- Render

---

## 🚀 Run Locally

### Prerequisites

Install:

- Node.js 18+
- C++17 compiler
- CMake 3.10+
- Make (optional)

### 1. Clone the repository

~~~bash
git clone https://github.com/parthiv-doraswamy/MetroFlow.git
cd MetroFlow
~~~

### 2. Build the C++ engine

~~~bash
cd cpp-engine
mkdir -p build
cmake -S . -B build
cmake --build build
cd ..
~~~

Or:

~~~bash
cd cpp-engine
make
cd ..
~~~

### 3. Install backend dependencies

~~~bash
cd backend
npm install
cd ..
~~~

### 4. Start MetroFlow

From the project root:

~~~bash
node backend/server.js
~~~

Open:

**http://localhost:5187**

---

## 🐳 Docker

The included Dockerfile builds the C++ engine and runs the Node.js server in the same container.

### Docker Compose

~~~bash
docker compose up --build
~~~

Then open:

**http://localhost:5187**

### Manual Docker build

~~~bash
docker build -t metroflow .
docker run -p 5187:5187 metroflow
~~~

---

## ⚙️ Configuration

Supported environment variables:

~~~text
PORT
CPP_ENGINE_PATH
CPP_TIMEOUT_MS
NODE_ENV
~~~

Example:

~~~bash
PORT=5187
CPP_ENGINE_PATH=cpp-engine/build/metro_engine
CPP_TIMEOUT_MS=5000
NODE_ENV=development
~~~

The production Docker configuration points the backend to the compiled C++ executable inside the container.

---

## ☁️ Deployment

MetroFlow is deployed as a **single Docker-based web service**.

~~~text
GitHub
   ↓
Render
   ↓
Docker build
   ↓
Compile C++ engine
   ↓
Start Node.js + Express
   ↓
Serve frontend + API
~~~

### Live application

**https://metroflow-xoen.onrender.com**

The application does not require a database, Redis instance, or separate C++ server.

---

## 🔐 Design Decisions

### Why C++ for routing?

The primary goal of MetroFlow is to demonstrate graph algorithms inside an actual application rather than only as isolated competitive-programming solutions.

The graph, Dijkstra implementation, BFS implementation, and routing calculations therefore remain in C++.

### Why Node.js?

Node.js provides the web/API layer around the C++ engine and handles:

- HTTP requests
- Input validation
- Route enrichment
- Caching
- Serving the frontend

### Why an in-memory cache?

The current application does not need Redis or a database. A small manual LRU cache is enough to demonstrate caching while keeping the architecture understandable and lightweight.

### Why one Docker service?

The Node.js backend and C++ engine are tightly coupled. Packaging them together keeps deployment simple and avoids unnecessary microservice complexity for a project of this size.

---

## 🔄 Development Approach

MetroFlow was developed incrementally:

~~~text
Graph data
    ↓
C++ graph implementation
    ↓
Dijkstra + BFS
    ↓
C++ JSON CLI engine
    ↓
Node.js / Express integration
    ↓
Route caching + enrichment
    ↓
Frontend planner
    ↓
Interactive network visualization
    ↓
Dockerized deployment
~~~

This separation keeps the algorithmic core independent from the web interface while still exposing it through a usable application.

---

## 🔮 Future Improvements

Possible next steps include:

- Minimum-transfer route optimization
- Transfer-aware routing costs
- Real-time train/service information
- Route comparison between distance and time
- Persistent route analytics
- Shared caching for multiple backend instances
- Closed-station and unavailable-line constraints
- More advanced map interactions
- Automated browser end-to-end testing

---

## 📌 Project Highlights

MetroFlow brings together:

**Data Structures & Algorithms + C++ + Backend Engineering + API Design + Caching + Frontend Development + Docker Deployment**

The central idea is simple:

> **Take a weighted graph and a real routing algorithm, then turn it into a complete web application.**
