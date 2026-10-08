cmake_minimum_required(VERSION 3.10)
project(MetroFlowEngine)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include)

add_executable(metro_engine
    src/main.cpp
    src/Graph.cpp
    src/Station.cpp
    src/Route.cpp
    src/Json.cpp
)

set_target_properties(metro_engine PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}
)
