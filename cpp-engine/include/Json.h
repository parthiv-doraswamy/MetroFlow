// Json.h — minimal JSON helpers for the controlled MetroFlow protocol.
// We avoid third-party deps; this handles string escaping and the small
// request/response shapes used on stdin/stdout.
#pragma once
#include <string>

namespace mini {
std::string escape(const std::string& s);
std::string getStringField(const std::string& json, const std::string& key, bool& found);
long getIntField(const std::string& json, const std::string& key, bool& found);
double getDoubleField(const std::string& json, const std::string& key, bool& found);
bool hasKey(const std::string& json, const std::string& key);
std::string toLower(const std::string& s);
bool containsIgnoreCase(const std::string& haystack, const std::string& needle);
}  // namespace mini
