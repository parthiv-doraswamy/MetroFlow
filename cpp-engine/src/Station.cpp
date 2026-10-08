// Station.cpp — JSON serialization helpers for Station.
#include "Station.h"
#include "Json.h"
#include <cstdio>

std::string stationToJson(const Station& s) {
    char buf[512];
    std::snprintf(buf, sizeof(buf),
        "{\"id\":%d,\"name\":\"%s\",\"line\":\"%s\",\"lat\":%.6f,\"lng\":%.6f}",
        s.id, mini::escape(s.name).c_str(), mini::escape(s.line).c_str(), s.lat, s.lng);
    return std::string(buf);
}
