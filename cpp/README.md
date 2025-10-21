# Route Analyzer - C++ Implementation

A comprehensive C++ implementation of the Route Analyzer project featuring priority-based assignment algorithms with road distance optimization.

## 🚀 Features

### Core Algorithms
- **Priority-Based Assignment**: PWD → Female → Male priority system
- **Road Distance Calculation**: OSRM API integration with libcurl
- **Haversine Distance**: Fallback straight-line distance calculation
- **Caching System**: 5-minute cache for API responses
- **Progress Tracking**: Real-time progress callbacks

### Data Structures
- **Graph**: Adjacency list representation with Dijkstra's algorithm
- **Priority Queue**: Efficient priority-based sorting
- **Point**: Geographic coordinates with distance calculations
- **Assignment Results**: Comprehensive result tracking

### Performance Optimizations
- **Batch Processing**: Optimized API request batching
- **Memory Management**: Efficient data structures and caching
- **Error Handling**: Graceful fallbacks and error recovery
- **Progress Monitoring**: Real-time progress updates

## 📁 Project Structure

```
cpp/
├── include/                 # Header files
│   ├── RandomPointGenerator.h
│   ├── AssignmentAlgorithm.h
│   ├── RoadDistanceService.h
│   ├── Graph.h
│   └── Dijkstra.h
├── src/                     # Source files
│   ├── RandomPointGenerator.cpp
│   ├── Graph.cpp
│   └── Dijkstra.cpp
├── main.cpp                # Main application
├── CMakeLists.txt          # CMake build configuration
├── Makefile               # Make build configuration
└── README.md              # This file
```

## 🛠️ Building the Project

### Prerequisites

- **C++17 Compiler**: GCC 7+ or Clang 5+
- **libcurl**: For HTTP requests to OSRM API
- **CMake**: 3.10+ (optional)
- **Make**: For Makefile builds

### Install Dependencies (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install -y build-essential libcurl4-openssl-dev pkg-config cmake
```

### Build with Make

```bash
# Check dependencies
make check-deps

# Build the project
make

# Build and run
make run

# Build debug version
make debug

# Build optimized release
make release
```

### Build with CMake

```bash
mkdir build && cd build
cmake ..
make
./RouteAnalyzer
```

## 🎯 Usage

### Basic Usage

```bash
./RouteAnalyzer
```

The program will:
1. Generate sample people (Male/Female/PWD) and test centers
2. Demonstrate straight-line distance assignment
3. Demonstrate road-based distance assignment
4. Show performance comparison between methods

### Program Output

```
=== Route Analyzer - C++ DSA Project ===
Priority-Based Assignment with Road Distance Optimization
========================================================

--- Generating Sample Data ---
Generating 50 people...
Generating 5 test centers...
Sample data generated successfully!

Data Summary:
People: 50
  - Male: 22
  - Female: 23
  - PWD: 5
Test Centers: 5

--- Straight-Line Distance Assignment ---
Calculating straight-line distance matrix...
Straight-line assignment completed in 2 ms

Assignment Results (straight-line):
Total Assigned: 50
PWD Assigned: 5
Female Assigned: 23
Male Assigned: 22
Average Distance: 2.34 km
Max Distance: 4.12 km
Min Distance: 0.45 km

--- Road-Based Distance Assignment ---
Calculating road-based distance matrix...
Progress: Processed 10/250 distances (4%)
Progress: Processed 20/250 distances (8%)
...
Road-based assignment completed in 15420 ms

Assignment Results (road-based):
Total Assigned: 50
PWD Assigned: 5
Female Assigned: 23
Male Assigned: 22
Average Distance: 3.67 km
Max Distance: 6.23 km
Min Distance: 0.78 km

--- Performance Comparison ---
   People   Centers Straight-line    Road-based      Speedup
-----------------------------------------------------------------
        10        2           1 ms          245 ms      245.00x
        10        3           1 ms          312 ms      312.00x
        25        2           2 ms          623 ms      311.50x
        25        3           2 ms          789 ms      394.50x
```

## 🔧 API Reference

### RoadDistanceService

```cpp
class RoadDistanceService {
public:
    // Calculate road distance between two points
    double calculateRoadDistance(const Point& point1, const Point& point2);
    
    // Calculate distance matrix for all points
    std::vector<std::vector<double>> calculateRoadDistanceMatrix(
        const std::vector<Point>& people, 
        const std::vector<Point>& testCenters);
    
    // Set progress callback
    void setProgressCallback(std::function<void(int, int, const std::string&)> callback);
    
    // Cache management
    void clearCache();
    std::map<std::string, int> getCacheStats() const;
};
```

### AssignmentAlgorithm

```cpp
class AssignmentAlgorithm {
public:
    // Assign people to test centers with priority
    std::vector<AssignmentResult> assignPeopleToTestCenters(
        const std::vector<Point>& people, 
        const std::vector<Point>& testCenters, 
        int capacityPerCenter = 50,
        RoadDistanceService* roadService = nullptr);
    
    // Distance calculation methods
    void setRoadDistanceEnabled(bool enabled);
    bool isRoadDistanceEnabled() const;
    
    // Results and statistics
    AssignmentStats getAssignmentStats() const;
    std::map<int, int> getAssignments() const;
    void clearAssignments();
};
```

### Point Class

```cpp
struct Point {
    double latitude;
    double longitude;
    std::string type;      // "person" or "test_center"
    std::string category;  // "male", "female", "pwd" for people
    
    // Calculate Haversine distance to another point
    double distanceTo(const Point& other) const;
};
```

## 📊 Performance Characteristics

### Time Complexity
- **Straight-line Assignment**: O(P × C + P log P)
- **Road-based Assignment**: O(P × C × R) + O(P log P)
- Where P = People, C = Test Centers, R = Route calculation time

### Space Complexity
- **Distance Matrix**: O(P × C)
- **Cache Storage**: O(P × C) with 5-minute expiration
- **Assignment Storage**: O(P)

### Performance Benchmarks
- **Small Dataset** (10 people, 2 centers): ~245ms road vs 1ms straight-line
- **Medium Dataset** (25 people, 3 centers): ~789ms road vs 2ms straight-line
- **Large Dataset** (50 people, 5 centers): ~15s road vs 2ms straight-line

## 🐛 Error Handling

The implementation includes comprehensive error handling:

- **API Failures**: Graceful fallback to Haversine distance
- **Network Issues**: Timeout handling and retry logic
- **Invalid Data**: Input validation and bounds checking
- **Memory Management**: RAII and smart pointer usage

## 🔍 Debugging

### Debug Build
```bash
make debug
gdb ./RouteAnalyzer
```

### Verbose Output
The program provides detailed logging:
- Progress updates during distance calculation
- Assignment statistics and results
- Performance timing information
- Error messages and fallback notifications

## 🚀 Future Enhancements

- **A* Algorithm**: Local pathfinding optimization
- **Parallel Processing**: Multi-threaded distance calculation
- **Database Integration**: Persistent caching and storage
- **GUI Interface**: Qt or similar graphical interface
- **Real-time Updates**: Live progress monitoring

## 📝 License

This project is part of the Route Analyzer DSA project and follows the same licensing terms.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the debugging section above
- Review the error handling documentation
- Ensure all dependencies are properly installed
- Verify network connectivity for OSRM API calls
