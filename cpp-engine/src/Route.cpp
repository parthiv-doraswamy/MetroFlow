// Route.cpp — serialization helpers for Route results.
#include "Route.h"
#include "Json.h"
#include <cstdio>

std::string routePathToJsonArray(const std::vector<int>& path) {
    std::string out = "[";
    for (size_t i = 0; i < path.size(); ++i) {
        if (i) out += ",";
        out += std::to_string(path[i]);
    }
    out += "]";
    return out;
}
