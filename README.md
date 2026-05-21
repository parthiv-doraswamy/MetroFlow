# 🚇 MetroFlow – Smart Route Planner

MetroFlow is a full-stack smart metro navigation system that computes optimized travel routes using graph algorithms implemented in native C++ and visualizes them through an interactive frontend dashboard.

The project integrates:
- C++ Graph Algorithms
- Node.js Backend APIs
- Interactive JavaScript Visualization
- Real-time Route Computation

---

# 📌 Features

✅ Dijkstra Shortest Path Algorithm  
✅ BFS Graph Traversal Visualization  
✅ Interactive Metro Network Visualization  
✅ Dynamic Route Highlighting  
✅ REST API Integration  
✅ Full-Stack Architecture  
✅ Responsive Modern UI  
✅ Distance & Travel Time Estimation  
✅ Cross-Platform Backend Support  
✅ Scalable Graph-Based System Design  

---

# 🏗️ System Architecture

```text
Frontend (HTML/CSS/JS)
        │
        │ Fetch API
        ▼
Node.js Backend (Express.js)
        │
        │ Executes
        ▼
C++ Graph Engine
(Dijkstra + BFS)
        │
        ▼
JSON Response
        │
        ▼
Interactive Visualization
```

---

# 🧠 Algorithms Implemented

## 1. Dijkstra’s Algorithm

Used for:
- shortest path computation
- route optimization
- minimum distance traversal

### Time Complexity

```text
O(E log V)
```

### Concepts Used

- Priority Queue
- Weighted Graphs
- Adjacency Lists
- Greedy Algorithms
- STL Containers

---

## 2. Breadth First Search (BFS)

Used for:
- graph traversal visualization
- metro network exploration

### Time Complexity

```text
O(V + E)
```

---

# 💻 Tech Stack

## Frontend

- HTML5
- CSS3
- JavaScript
- Vis.js

## Backend

- Node.js
- Express.js

## Core Algorithms

- C++
- STL
- Graph Algorithms
- Priority Queues
- Adjacency Lists

---

# 📂 Project Structure

```text
MetroFlow/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── backend/
│   ├── package.json
│   └── server.js
│
├── cpp/
│   ├── graph.h
│   └── metro.cpp
│
└── README.md
```

---

# ⚙️ Installation & Setup

---

## 1️⃣ Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/MetroFlow.git
```

---

## 2️⃣ Install Backend Dependencies

```bash
cd backend
npm install
```

---

# 🖥️ Compile C++ Graph Engine

## macOS / Linux

```bash
cd cpp
g++ -std=c++17 metro.cpp -o metro
chmod +x metro
```

## Windows

```bash
cd cpp
g++ -std=c++17 metro.cpp -o metro.exe
```

---

# 🚀 Start Backend Server

```bash
cd backend
npm start
```

Expected Output:

```text
Server running on port 3000
```

---

# 🌐 Run Frontend

Open:

```text
frontend/index.html
```

OR use:
- VS Code Live Server Extension

---

# 📸 Project Preview

## Features Demonstrated

- Interactive Metro Graph
- Shortest Route Visualization
- Dynamic Node Traversal
- BFS Animation
- REST API Communication
- Real-Time Path Highlighting

---

# 🔥 Key Engineering Highlights

- Integrated native C++ graph computation with Node.js backend APIs
- Built scalable weighted graph architecture using adjacency lists
- Designed interactive graph traversal visualization system
- Engineered cross-platform execution support for Windows/macOS/Linux
- Optimized shortest-path computation using STL priority queues

---

# 📈 Future Enhancements

- Real Metro Station Names
- GIS / OpenStreetMap Integration
- A* Pathfinding Algorithm
- Multi-Route Suggestions
- Fare Calculation
- Live Traffic Simulation
- Train Movement Animation
- MongoDB Route Persistence
- AI-Based Route Recommendation

---

# 🧪 Example API Request

## POST `/route`

### Request

```json
{
  "source": "A",
  "destination": "T"
}
```

### Response

```json
{
  "distance": 35,
  "path": [
    "A",
    "B",
    "G",
    "L",
    "M",
    "T"
  ]
}
```

---

# 📄 Resume Description

### MetroFlow – Smart Route Planner

**C++, Node.js, JavaScript, Graph Algorithms, HTML, CSS**

- Built a full-stack metro route planner integrating a Node.js backend with native C++ graph algorithms.
- Implemented Dijkstra’s Algorithm and BFS in C++ using STL, priority queues, and adjacency lists for optimized shortest-path computation.
- Developed REST APIs in Express.js to dynamically execute C++ route computation and return optimized paths.
- Designed an interactive frontend visualization system using JavaScript and Vis.js for graph traversal and route mapping.
- Engineered scalable graph architecture supporting dynamic node traversal, distance calculation, and route highlighting.

---

# 👨‍💻 Author

### Parthiv Doraswamy

- LinkedIn: https://linkedin.com/in/parthiv-doraswamy-5a6351351
---

# ⭐ If you found this project useful, consider starring the repository.