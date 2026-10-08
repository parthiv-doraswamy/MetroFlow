// Route.h — MetroFlow C++ engine
// Result of Dijkstra shortest-path + fare/time aggregation.
#pragma once
#include <string>
#include <vector>

struct Route {
    bool found = false;
    std::string error;
    std::vector<int> path;      // station ids in order
    double distance = 0.0;      // km
    int travelTime = 0;         // minutes
    int fare = 0;               // Rs (demo slab model)
    int stops = 0;              // path.size()
};

struct NearbyStation {
    int id = -1;
    std::string name;
    std::string line;
    int hops = 0;
};

// JSON serialization (defined in src/Route.cpp).
std::string routePathToJsonArray(const std::vector<int>& path);
