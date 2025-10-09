#ifndef GRAPH_H
#define GRAPH_H

#include <string>
#include <vector>
#include <map>
#include <unordered_map>
#include <unordered_set>

class Graph {
private:
    std::unordered_map<std::string, std::vector<std::pair<std::string, int>>> adjacencyList;
    std::unordered_set<std::string> vertices;

public:
    // Constructor
    Graph();
    
    // Destructor
    ~Graph();
    
    // Add a vertex to the graph
    void addVertex(const std::string& vertex);
    
    // Add an edge between two vertices with a weight
    void addEdge(const std::string& from, const std::string& to, int weight);
    
    // Remove a vertex from the graph
    void removeVertex(const std::string& vertex);
    
    // Remove an edge between two vertices
    void removeEdge(const std::string& from, const std::string& to);
    
    // Check if a vertex exists
    bool hasVertex(const std::string& vertex) const;
    
    // Check if an edge exists
    bool hasEdge(const std::string& from, const std::string& to) const;
    
    // Get the weight of an edge
    int getEdgeWeight(const std::string& from, const std::string& to) const;
    
    // Get all neighbors of a vertex
    std::vector<std::string> getNeighbors(const std::string& vertex) const;
    
    // Get all vertices
    std::vector<std::string> getVertices() const;
    
    // Get the number of vertices
    size_t getVertexCount() const;
    
    // Get the number of edges
    size_t getEdgeCount() const;
    
    // Display the graph structure
    void displayGraph() const;
    
    // Clear the graph
    void clear();
    
    // Get adjacency list (for Dijkstra algorithm)
    const std::unordered_map<std::string, std::vector<std::pair<std::string, int>>>& getAdjacencyList() const;
};

#endif // GRAPH_H
