cmake_minimum_required(VERSION 3.10)
project(RouteAnalyzer)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find required packages
find_package(PkgConfig REQUIRED)
pkg_check_modules(CURL REQUIRED libcurl)

# Include directories
include_directories(include)

# Source files
set(SOURCES
    src/RandomPointGenerator.cpp
    src/Graph.cpp
    main.cpp
)

# Create executable
add_executable(RouteAnalyzer ${SOURCES})

# Link libraries
target_link_libraries(RouteAnalyzer ${CURL_LIBRARIES})

# Compiler flags
target_compile_options(RouteAnalyzer PRIVATE ${CURL_CFLAGS_OTHER})

# Compiler definitions
target_compile_definitions(RouteAnalyzer PRIVATE ${CURL_CFLAGS})

# Installation
install(TARGETS RouteAnalyzer DESTINATION bin)

# Print configuration info
message(STATUS "RouteAnalyzer Configuration:")
message(STATUS "  C++ Standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "  CURL Libraries: ${CURL_LIBRARIES}")
message(STATUS "  CURL Include Paths: ${CURL_INCLUDE_DIRS}")
message(STATUS "  CURL Compile Flags: ${CURL_CFLAGS_OTHER}")
