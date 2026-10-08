// Json.cpp — minimal JSON utilities (no third-party dependency).
#include "Json.h"
#include <cctype>

namespace mini {

std::string escape(const std::string& s) {
    std::string out;
    out.reserve(s.size() + 4);
    for (char c : s) {
        switch (c) {
            case '"': out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\n': out += "\\n"; break;
            case '\r': out += "\\r"; break;
            case '\t': out += "\\t"; break;
            default: out += c; break;
        }
    }
    return out;
}

std::string toLower(const std::string& s) {
    std::string out = s;
    for (auto& c : out) c = (char)std::tolower((unsigned char)c);
    return out;
}

bool containsIgnoreCase(const std::string& haystack, const std::string& needle) {
    if (needle.empty()) return true;
    return toLower(haystack).find(toLower(needle)) != std::string::npos;
}

static bool skipValue(const std::string& json, size_t& i);

static void skipWs(const std::string& json, size_t& i) {
    while (i < json.size() && std::isspace((unsigned char)json[i])) ++i;
}

// Find "key" at object level and return raw value span [vStart, vEnd).
static bool findKey(const std::string& json, const std::string& key, size_t& vStart, size_t& vEnd) {
    std::string quoted = "\"" + key + "\"";
    size_t pos = 0;
    while (true) {
        pos = json.find(quoted, pos);
        if (pos == std::string::npos) return false;
        size_t i = pos + quoted.size();
        skipWs(json, i);
        if (i < json.size() && json[i] == ':') {
            ++i;
            skipWs(json, i);
            vStart = i;
            if (!skipValue(json, i)) return false;
            vEnd = i;
            return true;
        }
        pos += quoted.size();
    }
}

static bool skipValue(const std::string& json, size_t& i) {
    skipWs(json, i);
    if (i >= json.size()) return false;
    if (json[i] == '"') {
        ++i;
        while (i < json.size()) {
            if (json[i] == '\\') { i += 2; continue; }
            if (json[i] == '"') { ++i; return true; }
            ++i;
        }
        return false;
    }
    if (json[i] == '{' || json[i] == '[') {
        char open = json[i], close = (open == '{' ? '}' : ']');
        int depth = 0;
        bool inStr = false;
        for (; i < json.size(); ++i) {
            char c = json[i];
            if (inStr) {
                if (c == '\\') { ++i; continue; }
                if (c == '"') inStr = false;
                continue;
            }
            if (c == '"') { inStr = true; continue; }
            if (c == open) ++depth;
            else if (c == close) { --depth; if (depth == 0) { ++i; return true; } }
        }
        return false;
    }
    // number / true / false / null
    while (i < json.size() && json[i] != ',' && json[i] != '}' && json[i] != ']') ++i;
    return true;
}

static std::string unescape(const std::string& raw) {
    std::string out;
    for (size_t i = 0; i < raw.size(); ++i) {
        if (raw[i] == '\\' && i + 1 < raw.size()) {
            char n = raw[i + 1];
            if (n == '"') out += '"';
            else if (n == '\\') out += '\\';
            else if (n == 'n') out += '\n';
            else if (n == 't') out += '\t';
            else if (n == 'r') out += '\r';
            else { out += n; }
            ++i;
        } else {
            out += raw[i];
        }
    }
    return out;
}

std::string getStringField(const std::string& json, const std::string& key, bool& found) {
    size_t s, e;
    if (!findKey(json, key, s, e)) { found = false; return ""; }
    found = true;
    // value should be "...."
    size_t i = s;
    skipWs(json, i);
    if (i < json.size() && json[i] == '"') {
        ++i;
        std::string raw;
        while (i < json.size() && json[i] != '"') {
            if (json[i] == '\\' && i + 1 < json.size()) { raw += json[i]; raw += json[i + 1]; i += 2; continue; }
            raw += json[i++];
        }
        return unescape(raw);
    }
    // non-string: return trimmed raw
    std::string raw = json.substr(s, e - s);
    size_t a = 0;
    while (a < raw.size() && std::isspace((unsigned char)raw[a])) ++a;
    size_t b = raw.size();
    while (b > a && std::isspace((unsigned char)raw[b - 1])) --b;
    return raw.substr(a, b - a);
}

long getIntField(const std::string& json, const std::string& key, bool& found) {
    size_t s, e;
    if (!findKey(json, key, s, e)) { found = false; return 0; }
    std::string raw = json.substr(s, e - s);
    try {
        found = true;
        // strip quotes if present
        size_t a = 0;
        while (a < raw.size() && (std::isspace((unsigned char)raw[a]) || raw[a] == '"')) ++a;
        size_t b = raw.size();
        while (b > a && (std::isspace((unsigned char)raw[b - 1]) || raw[b - 1] == '"')) --b;
        std::string t = raw.substr(a, b - a);
        if (t.empty()) { found = false; return 0; }
        return std::stol(t);
    } catch (...) { found = false; return 0; }
}

double getDoubleField(const std::string& json, const std::string& key, bool& found) {
    size_t s, e;
    if (!findKey(json, key, s, e)) { found = false; return 0.0; }
    std::string raw = json.substr(s, e - s);
    try {
        found = true;
        size_t a = 0;
        while (a < raw.size() && (std::isspace((unsigned char)raw[a]) || raw[a] == '"')) ++a;
        size_t b = raw.size();
        while (b > a && (std::isspace((unsigned char)raw[b - 1]) || raw[b - 1] == '"')) --b;
        std::string t = raw.substr(a, b - a);
        if (t.empty()) { found = false; return 0.0; }
        return std::stod(t);
    } catch (...) { found = false; return 0.0; }
}

bool hasKey(const std::string& json, const std::string& key) {
    size_t s, e;
    return findKey(json, key, s, e);
}

}  // namespace mini
