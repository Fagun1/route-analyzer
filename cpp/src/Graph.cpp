#include "../include/Graph.h"
#include <iostream>
#include <algorithm>

Graph::Graph() {
    // Constructor - empty graph
}

Graph::~Graph() {
    // Destructor - cleanup handled by STL containers
}

void Graph::addVertex(const std::string& vertex) {
    if (vertices.find(vertex) == vertices.end()) {
        vertices.insert(vertex);
        adjacencyList[vertex] = std::vector<std::pair<std::string, int>>();
    }
}

void Graph::addEdge(const std::string& from, const std::string& to, int weight) {
    // Add vertices if they don't exist
    addVertex(from);
    addVertex(to);
    
    // Add edge (assuming undirected graph for simplicity)
    // Check if edge already exists
    bool edgeExists = false;
    for (const auto& neighbor : adjacencyList[from]) {
        if (neighbor.first == to) {
            edgeExists = true;
            break;
        }
    }
    
    if (!edgeExists) {
        adjacencyList[from].push_back({to, weight});
        adjacencyList[to].push_back({from, weight});
    }
}

void Graph::removeVertex(const std::string& vertex) {
    if (vertices.find(vertex) == vertices.end()) {
        return; // Vertex doesn't exist
    }
    
    // Remove all edges connected to this vertex
    for (const auto& neighbor : adjacencyList[vertex]) {
        auto& neighbors = adjacencyList[neighbor.first];
        neighbors.erase(
            std::remove_if(neighbors.begin(), neighbors.end(),
                [&vertex](const std::pair<std::string, int>& edge) {
                    return edge.first == vertex;
                }),
            neighbors.end()
        );
    }
    
    // Remove the vertex
    adjacencyList.erase(vertex);
    vertices.erase(vertex);
}

void Graph::removeEdge(const std::string& from, const std::string& to) {
    if (!hasEdge(from, to)) {
        return; // Edge doesn't exist
    }
    
    // Remove edge from both directions (undirected graph)
    auto& fromNeighbors = adjacencyList[from];
    fromNeighbors.erase(
        std::remove_if(fromNeighbors.begin(), fromNeighbors.end(),
            [&to](const std::pair<std::string, int>& edge) {
                return edge.first == to;
            }),
        fromNeighbors.end()
    );
    
    auto& toNeighbors = adjacencyList[to];
    toNeighbors.erase(
        std::remove_if(toNeighbors.begin(), toNeighbors.end(),
            [&from](const std::pair<std::string, int>& edge) {
                return edge.first == from;
            }),
        toNeighbors.end()
    );
}

bool Graph::hasVertex(const std::string& vertex) const {
    return vertices.find(vertex) != vertices.end();
}

bool Graph::hasEdge(const std::string& from, const std::string& to) const {
    if (!hasVertex(from) || !hasVertex(to)) {
        return false;
    }
    
    const auto& neighbors = adjacencyList.at(from);
    for (const auto& neighbor : neighbors) {
        if (neighbor.first == to) {
            return true;
        }
    }
    return false;
}

int Graph::getEdgeWeight(const std::string& from, const std::string& to) const {
    if (!hasEdge(from, to)) {
        return -1; // Edge doesn't exist
    }
    
    const auto& neighbors = adjacencyList.at(from);
    for (const auto& neighbor : neighbors) {
        if (neighbor.first == to) {
            return neighbor.second;
        }
    }
    return -1;
}

std::vector<std::string> Graph::getNeighbors(const std::string& vertex) const {
    std::vector<std::string> neighbors;
    
    if (hasVertex(vertex)) {
        const auto& neighborList = adjacencyList.at(vertex);
        for (const auto& neighbor : neighborList) {
            neighbors.push_back(neighbor.first);
        }
    }
    
    return neighbors;
}

std::vector<std::string> Graph::getVertices() const {
    std::vector<std::string> vertexList;
    for (const auto& vertex : vertices) {
        vertexList.push_back(vertex);
    }
    return vertexList;
}

size_t Graph::getVertexCount() const {
    return vertices.size();
}

size_t Graph::getEdgeCount() const {
    size_t count = 0;
    for (const auto& pair : adjacencyList) {
        count += pair.second.size();
    }
    return count / 2; // Divide by 2 for undirected graph
}

void Graph::displayGraph() const {
    std::cout << "Vertices: ";
    for (const auto& vertex : vertices) {
        std::cout << vertex << " ";
    }
    std::cout << std::endl;
    
    std::cout << "Edges:" << std::endl;
    for (const auto& pair : adjacencyList) {
        std::cout << "  " << pair.first << " -> ";
        for (size_t i = 0; i < pair.second.size(); ++i) {
            std::cout << "(" << pair.second[i].first << ", " << pair.second[i].second << ")";
            if (i < pair.second.size() - 1) {
                std::cout << ", ";
            }
        }
        std::cout << std::endl;
    }
}

void Graph::clear() {
    adjacencyList.clear();
    vertices.clear();
}

const std::unordered_map<std::string, std::vector<std::pair<std::string, int>>>& Graph::getAdjacencyList() const {
    return adjacencyList;
}
