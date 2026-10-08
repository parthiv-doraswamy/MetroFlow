// Graph.h — MetroFlow C++ engine
// Weighted undirected graph using adjacency lists.
// Dijkstra (priority_queue) for shortest path, BFS (queue) for nearby stations.
#pragma once
#include <queue>
#include <string>
#include <unordered_map>
#include <vector>
#include "Station.h"
#include "Route.h"

struct Edge {
    int to = -1;
    double distance = 0.0;  // km
    int travelTime = 0;     // minutes
};

class Graph {
public:
    bool loadFromFile(const std::string& path, std::string& errOut);

    bool hasStation(int id) const;
    Station getStation(int id) const;
    std::vector<Station> allStations() const;
    std::vector<Station> searchStations(const std::string& query) const;
    std::vector<Edge> neighbors(int id) const;

    // Dijkstra over distance weights. Reconstructs full path.
    Route shortestPath(int source, int destination, const std::string& mode = "distance") const;

    // BFS over unweighted hops.
    std::vector<NearbyStation> nearbyStations(int source, int maxHops) const;

    // Demo fare slabs (documented in README).
    static int fareForDistance(double km);

    size_t stationCount() const { return stations_.size(); }
    size_t edgeCount() const;

private:
    std::unordered_map<int, Station> stations_;
    std::unordered_map<int, std::vector<Edge>> adj_;
};
