#!/bin/bash
# test_engine.sh — C++ engine tests (Dijkstra, BFS, fare, error cases).
# Usage: bash tests/cpp-tests/test_engine.sh [path-to-metro_engine]
# Engine path resolves relative to this script, so it works from any CWD.
set -u
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENGINE="${1:-$SCRIPT_DIR/../../cpp-engine/build/metro_engine}"
PASS=0
FAIL=0

check() {
  local name="$1"; local req="$2"; local expect="$3"
  local out
  out=$(echo "$req" | "$ENGINE" 2>/dev/null)
  if echo "$out" | grep -q "$expect"; then
    echo "PASS: $name"
    PASS=$((PASS + 1))
  else
    echo "FAIL: $name"
    echo "  request: $req"
    echo "  got:     $out"
    echo "  want ~:  $expect"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== MetroFlow C++ engine tests ==="
echo "engine: $ENGINE"
check "health reports 30 stations" '{"operation":"health"}' '"stations":30'
check "network operation returns station data" '{"operation":"network"}' '"stations"'
check "time mode works" '{"operation":"shortestPath","source":1,"destination":16,"mode":"time"}' '"mode":"time"'
check "shortest path 1->16 found" '{"operation":"shortestPath","source":1,"destination":16}' '"success":true'
check "path starts at source" '{"operation":"shortestPath","source":1,"destination":16}' '"path":\[1,'
check "fare computed" '{"operation":"shortestPath","source":1,"destination":16}' '"fare":35'
check "interchange route 17->30" '{"operation":"shortestPath","source":17,"destination":30}' '"success":true'
check "same source/destination" '{"operation":"shortestPath","source":5,"destination":5}' '"path":\[5\]'
check "zero fare same station" '{"operation":"shortestPath","source":5,"destination":5}' '"fare":0'
check "invalid station rejected" '{"operation":"shortestPath","source":1,"destination":999}' 'Unknown station id'
check "nearby BFS works" '{"operation":"nearby","station":5,"hops":2}' '"success":true'
check "nearby respects hops" '{"operation":"nearby","station":5,"hops":1}' '"hops":1'
check "unknown nearby rejected" '{"operation":"nearby","station":999,"hops":2}' 'Station not found'
check "search finds Central" '{"operation":"search","q":"central"}' 'Central'
check "allStations returns list" '{"operation":"allStations"}' 'Skylink Airport'
check "station detail works" '{"operation":"station","id":16}' 'Skylink Airport'
check "malformed JSON rejected" 'not json' 'Malformed JSON'
check "unknown operation rejected" '{"operation":"teleport"}' 'Unknown operation'

echo ""
echo "passed: $PASS, failed: $FAIL"
[ "$FAIL" -eq 0 ]
