// Graph.cpp — MetroFlow C++ engine
// Adjacency-list graph: Dijkstra (priority_queue) + BFS (queue).
#include "Graph.h"
#include "Json.h"
#include <algorithm>
#include <cmath>
#include <fstream>
#include <limits>
#include <queue>
#include <sstream>

namespace {
const double INF = std::numeric_limits<double>::infinity();

// Extract top-level {...} objects inside "key": [ ... ].
std::vector<std::string> extractArrayObjects(const std::string& json, const std::string& key) {
    std::vector<std::string> out;
    std::string quoted = "\"" + key + "\"";
    size_t kpos = json.find(quoted);
    if (kpos == std::string::npos) return out;
    size_t lb = json.find('[', kpos + quoted.size());
    if (lb == std::string::npos) return out;
    int depth = 0;
    bool inStr = false;
    size_t rb = std::string::npos;
    for (size_t i = lb; i < json.size(); ++i) {
        char c = json[i];
        if (inStr) {
            if (c == '\\') { ++i; continue; }
            if (c == '"') inStr = false;
            continue;
        }
        if (c == '"') { inStr = true; continue; }
        if (c == '[') ++depth;
        else if (c == ']') { --depth; if (depth == 0) { rb = i; break; } }
    }
    if (rb == std::string::npos) return out;
    for (size_t i = lb + 1; i < rb;) {
        while (i < rb && json[i] != '{') ++i;
        if (i >= rb) break;
        int d = 0;
        bool s = false;
        size_t start = i;
        size_t j = i;
        for (; j <= rb; ++j) {
            char c = json[j];
            if (s) {
                if (c == '\\') { ++j; continue; }
                if (c == '"') s = false;
                continue;
            }
            if (c == '"') { s = true; continue; }
            if (c == '{') ++d;
            else if (c == '}') { --d; if (d == 0) { ++j; break; } }
        }
        out.push_back(json.substr(start, j - start));
        i = j;
    }
    return out;
}

const Edge* findEdge(const std::vector<Edge>& edges, int to) {
    for (const auto& e : edges) {
        if (e.to == to) return &e;
    }
    return nullptr;
}
}  // namespace

bool Graph::loadFromFile(const std::string& path, std::string& errOut) {
    std::ifstream in(path);
    if (!in) { errOut = "Cannot open data file: " + path; return false; }
    std::stringstream ss;
    ss << in.rdbuf();
    std::string json = ss.str();
    auto stationObjs = extractArrayObjects(json, "stations");
    auto edgeObjs = extractArrayObjects(json, "edges");
    if (stationObjs.empty()) { errOut = "No stations found in data file"; return false; }
    stations_.clear();
    adj_.clear();
    for (const auto& o : stationObjs) {
        bool f = false;
        long id = mini::getIntField(o, "id", f);
        if (!f) continue;
        bool fn = false, fl = false;
        std::string name = mini::getStringField(o, "name", fn);
        std::string line = mini::getStringField(o, "line", fl);
        bool flat = false, flng = false;
        double lat = mini::getDoubleField(o, "lat", flat);
        double lng = mini::getDoubleField(o, "lng", flng);
        Station s;
        s.id = (int)id;
        s.name = fn ? name : ("Station " + std::to_string(id));
        s.line = fl ? line : "Unknown";
        s.lat = flat ? lat : 0.0;
        s.lng = flng ? lng : 0.0;
        stations_[s.id] = s;
        if (!adj_.count(s.id)) adj_[s.id] = {};
    }
    for (const auto& o : edgeObjs) {
        bool f1 = false, f2 = false, fd = false, ft = false;
        long from = mini::getIntField(o, "from", f1);
        long to = mini::getIntField(o, "to", f2);
        double dist = mini::getDoubleField(o, "distance", fd);
        long time = mini::getIntField(o, "time", ft);
        if (!f1) { from = mini::getIntField(o, "source", f1); }
        if (!f2) { to = mini::getIntField(o, "destination", f2); }
        if (!f1 || !f2) continue;
        if (!stations_.count((int)from) || !stations_.count((int)to)) continue;
        Edge a{(int)to, fd ? dist : 1.0, ft ? (int)time : 3};
        Edge b{(int)from, fd ? dist : 1.0, ft ? (int)time : 3};
        adj_[(int)from].push_back(a);
        adj_[(int)to].push_back(b);
    }
    return true;
}

bool Graph::hasStation(int id) const { return stations_.count(id) > 0; }

Station Graph::getStation(int id) const {
    auto it = stations_.find(id);
    if (it != stations_.end()) return it->second;
    return Station{};
}

std::vector<Station> Graph::allStations() const {
    std::vector<Station> out;
    out.reserve(stations_.size());
    for (const auto& kv : stations_) out.push_back(kv.second);
    std::sort(out.begin(), out.end(), [](const Station& a, const Station& b) { return a.id < b.id; });
    return out;
}

std::vector<Station> Graph::searchStations(const std::string& query) const {
    std::vector<Station> out;
    for (const auto& kv : stations_) {
        if (mini::containsIgnoreCase(kv.second.name, query)) out.push_back(kv.second);
    }
    std::sort(out.begin(), out.end(), [](const Station& a, const Station& b) { return a.id < b.id; });
    return out;
}

std::vector<Edge> Graph::neighbors(int id) const {
    auto it = adj_.find(id);
    if (it == adj_.end()) return {};
    return it->second;
}

size_t Graph::edgeCount() const {
    size_t total = 0;
    for (const auto& kv : adj_) total += kv.second.size();
    return total / 2;
}

int Graph::fareForDistance(double km) {
    if (km <= 0.0) return 0;
    if (km <= 5.0) return 15;
    if (km <= 10.0) return 25;
    if (km <= 15.0) return 35;
    if (km <= 20.0) return 45;
    return 55;
}

Route Graph::shortestPath(int source, int destination, const std::string& mode) const {
    Route r;
    if (mode != "distance" && mode != "time") {
        r.found = false;
        r.error = "Unsupported routing mode";
        return r;
    }
    if (!hasStation(source) || !hasStation(destination)) {
        r.found = false;
        r.error = "Unknown station id";
        return r;
    }
    if (source == destination) {
        r.found = true;
        r.path = {source};
        r.distance = 0.0;
        r.travelTime = 0;
        r.fare = 0;
        r.stops = 1;
        return r;
    }
    std::unordered_map<int, double> dist;
    std::unordered_map<int, int> parent;
    for (const auto& kv : stations_) dist[kv.first] = INF;
    dist[source] = 0.0;
    parent[source] = -1;
    using P = std::pair<double, int>;
    std::priority_queue<P, std::vector<P>, std::greater<P>> pq;
    pq.push({0.0, source});
    while (!pq.empty()) {
        auto top = pq.top(); pq.pop();
        double d = top.first; int u = top.second;
        if (d > dist[u] + 1e-12) continue;
        if (u == destination) break;
        auto it = adj_.find(u);
        if (it == adj_.end()) continue;
        for (const auto& e : it->second) {
            double weight = mode == "time" ? static_cast<double>(e.travelTime) : e.distance;
            double nd = d + weight;
            if (nd + 1e-12 < dist[e.to]) {
                dist[e.to] = nd;
                parent[e.to] = u;
                pq.push({nd, e.to});
            }
        }
    }
    if (dist[destination] == INF) {
        r.found = false;
        r.error = "No route available between these stations";
        return r;
    }
    std::vector<int> path;
    int cur = destination;
    while (cur != -1) {
        path.push_back(cur);
        auto it = parent.find(cur);
        if (it == parent.end()) break;
        cur = it->second;
    }
    std::reverse(path.begin(), path.end());
    r.found = true;
    r.path = path;
    // Recalculate both metrics from the chosen path so the UI can show them regardless of mode.
    r.distance = 0.0;
    int totalTime = 0;
    for (size_t i = 0; i + 1 < path.size(); ++i) {
        auto it = adj_.find(path[i]);
        if (it != adj_.end()) {
            const Edge* e = findEdge(it->second, path[i + 1]);
            if (e) {
                r.distance += e->distance;
                totalTime += e->travelTime;
            }
        }
    }
    r.travelTime = totalTime;
    r.fare = fareForDistance(r.distance);
    r.stops = (int)path.size();
    return r;
}

std::vector<NearbyStation> Graph::nearbyStations(int source, int maxHops) const {
    std::vector<NearbyStation> out;
    if (!hasStation(source)) return out;
    if (maxHops < 1) maxHops = 1;
    if (maxHops > 6) maxHops = 6;
    std::queue<int> q;
    std::unordered_map<int, int> hops;
    q.push(source);
    hops[source] = 0;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        auto it = adj_.find(u);
        if (it == adj_.end()) continue;
        for (const auto& e : it->second) {
            if (hops.count(e.to)) continue;
            int nh = hops[u] + 1;
            if (nh > maxHops) continue;
            hops[e.to] = nh;
            q.push(e.to);
        }
    }
    for (const auto& kv : hops) {
        if (kv.first == source) continue;
        Station s = getStation(kv.first);
        NearbyStation n;
        n.id = s.id; n.name = s.name; n.line = s.line; n.hops = kv.second;
        out.push_back(n);
    }
    std::sort(out.begin(), out.end(), [](const NearbyStation& a, const NearbyStation& b) {
        if (a.hops != b.hops) return a.hops < b.hops;
        return a.id < b.id;
    });
    return out;
}
