#include "../include/Dijkstra.h"
#include <limits>
#include <algorithm>
#include <functional>

Dijkstra::Dijkstra(const Graph& g) : graph(g) {
    // Constructor
}

Dijkstra::~Dijkstra() {
    // Destructor
}

std::pair<std::vector<std::string>, int> Dijkstra::findShortestPath(
    const std::string& start, 
    const std::string& end
) {
    // Validate input vertices
    if (!validateVertices(start, end)) {
        return {{}, -1};
    }
    
    // Initialize distance map with infinity
    std::unordered_map<std::string, int> distances;
    std::unordered_map<std::string, std::string> parent;
    std::unordered_set<std::string> visited;
    
    // Get all vertices
    auto vertices = graph.getVertices();
    for (const auto& vertex : vertices) {
        distances[vertex] = std::numeric_limits<int>::max();
    }
    
    // Distance to start vertex is 0
    distances[start] = 0;
    
    // Priority queue for Dijkstra's algorithm (min-heap)
    std::priority_queue<Node, std::vector<Node>, std::greater<Node>> pq;
    pq.push(Node(start, 0));
    
    while (!pq.empty()) {
        Node current = pq.top();
        pq.pop();
        
        std::string currentVertex = current.vertex;
        
        // Skip if already visited
        if (visited.find(currentVertex) != visited.end()) {
            continue;
        }
        
        visited.insert(currentVertex);
        
        // If we reached the end vertex, we can stop early
        if (currentVertex == end) {
            break;
        }
        
        // Get neighbors of current vertex
        auto neighbors = graph.getNeighbors(currentVertex);
        
        for (const auto& neighbor : neighbors) {
            if (visited.find(neighbor) == visited.end()) {
                int edgeWeight = graph.getEdgeWeight(currentVertex, neighbor);
                int newDistance = distances[currentVertex] + edgeWeight;
                
                if (newDistance < distances[neighbor]) {
                    distances[neighbor] = newDistance;
                    parent[neighbor] = currentVertex;
                    pq.push(Node(neighbor, newDistance));
                }
            }
        }
    }
    
    // Check if path exists
    if (distances[end] == std::numeric_limits<int>::max()) {
        return {{}, -1}; // No path found
    }
    
    // Reconstruct path
    std::vector<std::string> path = reconstructPath(parent, start, end);
    
    return {path, distances[end]};
}

std::unordered_map<std::string, int> Dijkstra::findShortestDistances(
    const std::string& start
) {
    std::unordered_map<std::string, int> distances;
    std::unordered_set<std::string> visited;
    
    // Get all vertices
    auto vertices = graph.getVertices();
    for (const auto& vertex : vertices) {
        distances[vertex] = std::numeric_limits<int>::max();
    }
    
    // Distance to start vertex is 0
    distances[start] = 0;
    
    // Priority queue for Dijkstra's algorithm
    std::priority_queue<Node, std::vector<Node>, std::greater<Node>> pq;
    pq.push(Node(start, 0));
    
    while (!pq.empty()) {
        Node current = pq.top();
        pq.pop();
        
        std::string currentVertex = current.vertex;
        
        // Skip if already visited
        if (visited.find(currentVertex) != visited.end()) {
            continue;
        }
        
        visited.insert(currentVertex);
        
        // Get neighbors of current vertex
        auto neighbors = graph.getNeighbors(currentVertex);
        
        for (const auto& neighbor : neighbors) {
            if (visited.find(neighbor) == visited.end()) {
                int edgeWeight = graph.getEdgeWeight(currentVertex, neighbor);
                int newDistance = distances[currentVertex] + edgeWeight;
                
                if (newDistance < distances[neighbor]) {
                    distances[neighbor] = newDistance;
                    pq.push(Node(neighbor, newDistance));
                }
            }
        }
    }
    
    return distances;
}

bool Dijkstra::pathExists(const std::string& start, const std::string& end) {
    auto result = findShortestPath(start, end);
    return !result.first.empty();
}

std::vector<std::string> Dijkstra::getReachableVertices(const std::string& start) {
    auto distances = findShortestDistances(start);
    std::vector<std::string> reachable;
    
    for (const auto& pair : distances) {
        if (pair.second != std::numeric_limits<int>::max()) {
            reachable.push_back(pair.first);
        }
    }
    
    return reachable;
}

std::pair<std::vector<std::string>, int> Dijkstra::findShortestPathWithCustomWeight(
    const std::string& start,
    const std::string& end,
    std::function<int(const std::string&, const std::string&)> weightFunction
) {
    // Validate input vertices
    if (!validateVertices(start, end)) {
        return {{}, -1};
    }
    
    // Initialize distance map with infinity
    std::unordered_map<std::string, int> distances;
    std::unordered_map<std::string, std::string> parent;
    std::unordered_set<std::string> visited;
    
    // Get all vertices
    auto vertices = graph.getVertices();
    for (const auto& vertex : vertices) {
        distances[vertex] = std::numeric_limits<int>::max();
    }
    
    // Distance to start vertex is 0
    distances[start] = 0;
    
    // Priority queue for Dijkstra's algorithm
    std::priority_queue<Node, std::vector<Node>, std::greater<Node>> pq;
    pq.push(Node(start, 0));
    
    while (!pq.empty()) {
        Node current = pq.top();
        pq.pop();
        
        std::string currentVertex = current.vertex;
        
        // Skip if already visited
        if (visited.find(currentVertex) != visited.end()) {
            continue;
        }
        
        visited.insert(currentVertex);
        
        // If we reached the end vertex, we can stop early
        if (currentVertex == end) {
            break;
        }
        
        // Get neighbors of current vertex
        auto neighbors = graph.getNeighbors(currentVertex);
        
        for (const auto& neighbor : neighbors) {
            if (visited.find(neighbor) == visited.end()) {
                int edgeWeight = weightFunction(currentVertex, neighbor);
                int newDistance = distances[currentVertex] + edgeWeight;
                
                if (newDistance < distances[neighbor]) {
                    distances[neighbor] = newDistance;
                    parent[neighbor] = currentVertex;
                    pq.push(Node(neighbor, newDistance));
                }
            }
        }
    }
    
    // Check if path exists
    if (distances[end] == std::numeric_limits<int>::max()) {
        return {{}, -1}; // No path found
    }
    
    // Reconstruct path
    std::vector<std::string> path = reconstructPath(parent, start, end);
    
    return {path, distances[end]};
}

std::vector<std::string> Dijkstra::reconstructPath(
    const std::unordered_map<std::string, std::string>& parent,
    const std::string& start,
    const std::string& end
) {
    std::vector<std::string> path;
    
    if (parent.find(end) == parent.end()) {
        return path; // No path found
    }
    
    // Reconstruct path from end to start
    std::string current = end;
    while (current != start) {
        path.push_back(current);
        current = parent.at(current);
    }
    path.push_back(start);
    
    // Reverse to get path from start to end
    std::reverse(path.begin(), path.end());
    
    return path;
}

bool Dijkstra::validateVertices(const std::string& start, const std::string& end) const {
    return graph.hasVertex(start) && graph.hasVertex(end);
}
