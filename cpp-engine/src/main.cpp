// main.cpp — MetroFlow C++ engine CLI.
// Protocol: JSON request on stdin, JSON response on stdout.
// The Node.js backend spawns this executable per request.
#include <cstdlib>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include "Graph.h"
#include "Json.h"
#include "Route.h"
#include "Station.h"

namespace {
std::string readStdin() {
    std::ostringstream ss;
    ss << std::cin.rdbuf();
    return ss.str();
}

std::string trim(const std::string& s) {
    size_t a = 0;
    while (a < s.size() && isspace((unsigned char)s[a])) ++a;
    size_t b = s.size();
    while (b > a && isspace((unsigned char)s[b - 1])) --b;
    return s.substr(a, b - a);
}

std::string errJson(const std::string& msg) {
    return "{\"success\":false,\"error\":\"" + mini::escape(msg) + "\"}";
}

std::string resolveDataPath(const char* argv0) {
    if (const char* env = std::getenv("METRO_DATA_PATH")) return std::string(env);
    std::string exe = argv0 ? argv0 : "";
    std::string dir;
    size_t slash = exe.find_last_of("/\\");
    if (slash != std::string::npos) dir = exe.substr(0, slash);
    std::vector<std::string> candidates;
    if (!dir.empty()) {
        candidates.push_back(dir + "/../data/metro_data.json");
        candidates.push_back(dir + "/data/metro_data.json");
        candidates.push_back(dir + "/../../cpp-engine/data/metro_data.json");
    }
    candidates.push_back("cpp-engine/data/metro_data.json");
    candidates.push_back("./cpp-engine/data/metro_data.json");
    candidates.push_back("data/metro_data.json");
    candidates.push_back("../cpp-engine/data/metro_data.json");
    for (const auto& c : candidates) {
        FILE* f = std::fopen(c.c_str(), "r");
        if (f) { std::fclose(f); return c; }
    }
    return "cpp-engine/data/metro_data.json";
}

std::string fmtDist(double d) {
    char buf[32];
    std::snprintf(buf, sizeof(buf), "%.1f", d + 1e-9);
    return std::string(buf);
}
}  // namespace

int main(int argc, char** argv) {
    std::string dataPath = resolveDataPath(argc > 0 ? argv[0] : nullptr);
    // Allow explicit data path as first arg when it points to a .json file.
    if (argc > 1) {
        std::string a = argv[1];
        if (a.size() > 5 && a.substr(a.size() - 5) == ".json") dataPath = a;
    }

    Graph g;
    std::string loadErr;
    if (!g.loadFromFile(dataPath, loadErr)) {
        std::cout << errJson("Engine failed to load network data: " + loadErr) << std::flush;
        return 1;
    }

    std::string raw = trim(readStdin());
    if (raw.empty()) {
        // No stdin: if argv carries inline JSON use it, else report usage error.
        if (argc > 1 && argv[1][0] == '{') raw = argv[1];
        else { std::cout << errJson("Empty request: expected JSON on stdin") << std::flush; return 1; }
    }
    if (raw.empty() || raw[0] != '{') {
        std::cout << errJson("Malformed JSON request") << std::flush;
        return 1;
    }

    bool fop = false;
    std::string op = mini::getStringField(raw, "operation", fop);
    if (!fop || op.empty()) {
        std::cout << errJson("Missing 'operation' field") << std::flush;
        return 1;
    }

    if (op == "health") {
        std::cout << "{\"success\":true,\"status\":\"ok\",\"stations\":"
                  << g.stationCount() << ",\"edges\":" << g.edgeCount() << "}" << std::flush;
        return 0;
    }
    if (op == "allStations") {
        std::string out = "{\"success\":true,\"stations\":[";
        auto all = g.allStations();
        for (size_t i = 0; i < all.size(); ++i) {
            if (i) out += ",";
            out += stationToJson(all[i]);
        }
        out += "]}";
        std::cout << out << std::flush;
        return 0;
    }
    if (op == "search") {
        bool fq = false;
        std::string q = mini::getStringField(raw, "q", fq);
        if (!fq) q = "";
        std::string out = "{\"success\":true,\"stations\":[";
        auto res = g.searchStations(q);
        for (size_t i = 0; i < res.size(); ++i) {
            if (i) out += ",";
            out += stationToJson(res[i]);
        }
        out += "]}";
        std::cout << out << std::flush;
        return 0;
    }
    if (op == "station") {
        bool fi = false;
        long id = mini::getIntField(raw, "id", fi);
        if (!fi) id = mini::getIntField(raw, "station", fi);
        if (!fi || !g.hasStation((int)id)) {
            std::cout << errJson("Station not found") << std::flush;
            return 0;
        }
        std::cout << "{\"success\":true,\"station\":" << stationToJson(g.getStation((int)id)) << "}" << std::flush;
        return 0;
    }
    if (op == "nearby") {
        bool fi = false, fh = false;
        long id = mini::getIntField(raw, "station", fi);
        if (!fi) id = mini::getIntField(raw, "id", fi);
        long hops = mini::getIntField(raw, "hops", fh);
        if (!fh) hops = 2;
        if (!fi || !g.hasStation((int)id)) {
            std::cout << errJson("Station not found") << std::flush;
            return 0;
        }
        auto list = g.nearbyStations((int)id, (int)hops);
        Station center = g.getStation((int)id);
        std::string out = "{\"success\":true,\"station\":\"" + mini::escape(center.name) + "\",";
        out += "\"stationId\":" + std::to_string(center.id) + ",\"nearby\":[";
        for (size_t i = 0; i < list.size(); ++i) {
            if (i) out += ",";
            out += "{\"id\":" + std::to_string(list[i].id) + ",\"name\":\"" +
                   mini::escape(list[i].name) + "\",\"line\":\"" +
                   mini::escape(list[i].line) + "\",\"hops\":" + std::to_string(list[i].hops) + "}";
        }
        out += "]}";
        std::cout << out << std::flush;
        return 0;
    }
    if (op == "network") {
        std::string out = "{\"success\":true,\"stations\":[";
        auto all = g.allStations();
        for (size_t i = 0; i < all.size(); ++i) {
            if (i) out += ",";
            out += stationToJson(all[i]);
        }
        out += "],\"edges\":[";
        bool first = true;
        for (const auto& s : all) {
            for (const auto& e : g.neighbors(s.id)) {
                if (s.id >= e.to) continue;
                if (!first) out += ",";
                first = false;
                out += "{\"from\":" + std::to_string(s.id) + ",\"to\":" +
                       std::to_string(e.to) + ",\"distance\":" + fmtDist(e.distance) +
                       ",\"time\":" + std::to_string(e.travelTime) + "}";
            }
        }
        out += "]}";
        std::cout << out << std::flush;
        return 0;
    }
    if (op == "shortestPath") {
        bool fs = false, fd = false, fm = false;
        long src = mini::getIntField(raw, "source", fs);
        long dst = mini::getIntField(raw, "destination", fd);
        std::string mode = mini::getStringField(raw, "mode", fm);
        if (!fm || mode.empty()) mode = "distance";
        if (!fs || !fd) {
            std::cout << errJson("Missing 'source' or 'destination' station id") << std::flush;
            return 0;
        }
        Route r = g.shortestPath((int)src, (int)dst, mode);
        if (!r.found) {
            std::cout << errJson(r.error.empty() ? "No route available" : r.error) << std::flush;
            return 0;
        }
        std::string out = "{\"success\":true,";
        out += "\"mode\":\"" + mini::escape(mode) + "\",";
        out += "\"path\":" + routePathToJsonArray(r.path) + ",";
        out += "\"distance\":" + fmtDist(r.distance) + ",";
        out += "\"time\":" + std::to_string(r.travelTime) + ",";
        out += "\"fare\":" + std::to_string(r.fare) + ",";
        out += "\"stops\":" + std::to_string(r.stops) + ",\"legs\":[";
        for (size_t i = 0; i + 1 < r.path.size(); ++i) {
            double d = 0.0; int t = 0;
            for (const auto& e : g.neighbors(r.path[i])) {
                if (e.to == r.path[i + 1]) { d = e.distance; t = e.travelTime; break; }
            }
            if (i) out += ",";
            out += "{\"from\":" + std::to_string(r.path[i]) + ",\"to\":" +
                   std::to_string(r.path[i + 1]) + ",\"distance\":" + fmtDist(d) +
                   ",\"time\":" + std::to_string(t) + "}";
        }
        out += "]}";
        std::cout << out << std::flush;
        return 0;
    }
    std::cout << errJson(std::string("Unknown operation: ") + op) << std::flush;
    return 1;
}
