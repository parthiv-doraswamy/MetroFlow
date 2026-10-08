# Makefile fallback (works without CMake on macOS/Linux).
CXX ?= g++
CXXFLAGS ?= -std=c++17 -O2 -Wall -Wextra -I include

SRC = src/main.cpp src/Graph.cpp src/Station.cpp src/Route.cpp src/Json.cpp
BIN = build/metro_engine

all: $(BIN)

$(BIN): $(SRC)
	mkdir -p build
	$(CXX) $(CXXFLAGS) $(SRC) -o $(BIN)

clean:
	rm -f $(BIN)

.PHONY: all clean
