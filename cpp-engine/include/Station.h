// Station.h — MetroFlow C++ engine
// Represents a single metro station node in the weighted graph.
#pragma once
#include <string>

struct Station {
    int id = -1;
    std::string name;
    std::string line;
    double lat = 0.0;
    double lng = 0.0;
};

// JSON serialization (defined in src/Station.cpp).
std::string stationToJson(const Station& s);
