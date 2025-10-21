#ifndef DIJKSTRA_H
#define DIJKSTRA_H

#include "Graph.h"
#include <string>
#include <vector>
#include <map>
#include <queue>
#include <unordered_map>
#include <unordered_set>
#include <functional>

class Dijkstra {
private:
    const Graph& graph;
    
    // Helper structure for priority queue
    struct Node {
        std::string vertex;
        int distance;
        
        Node(const std::string& v, int d) : vertex(v), distance(d) {}
        
        // Overload operator for priority queue (min-heap)
        bool operator>(const Node& other) const {
            return distance > other.distance;
        }
    };

public:
    // Constructor
    Dijkstra(const Graph& g);
    
    // Destructor
    ~Dijkstra();
    
    // Find shortest path from start to end vertex
    // Returns pair of (path, total_distance)
    std::pair<std::vector<std::string>, int> findShortestPath(
        const std::string& start, 
        const std::string& end
    );
    
    // Find shortest distances from start vertex to all other vertices
    std::unordered_map<std::string, int> findShortestDistances(
        const std::string& start
    );
    
    // Check if a path exists between two vertices
    bool pathExists(const std::string& start, const std::string& end);
    
    // Get all vertices reachable from start vertex
    std::vector<std::string> getReachableVertices(const std::string& start);
    
    // Find shortest path with custom weight function
    std::pair<std::vector<std::string>, int> findShortestPathWithCustomWeight(
        const std::string& start,
        const std::string& end,
        std::function<int(const std::string&, const std::string&)> weightFunction
    );

private:
    // Helper function to reconstruct path from parent map
    std::vector<std::string> reconstructPath(
        const std::unordered_map<std::string, std::string>& parent,
        const std::string& start,
        const std::string& end
    );
    
    // Validate input vertices
    bool validateVertices(const std::string& start, const std::string& end) const;
};

#endif // DIJKSTRA_H
