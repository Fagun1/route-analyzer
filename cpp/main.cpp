#include <iostream>
#include <vector>
#include <string>
#include <iomanip>
#include "include/Graph.h"
#include "include/Dijkstra.h"
#include "include/RandomPointGenerator.h"

int main() {
    std::cout << "Fastest Route Analyzer" << std::endl;
    std::cout << "=====================" << std::endl;
    
    // Create a graph
    Graph graph;
    
    // Add vertices (cities/locations)
    graph.addVertex("A");
    graph.addVertex("B");
    graph.addVertex("C");
    graph.addVertex("D");
    graph.addVertex("E");
    
    // Add edges (roads/connections) with weights (distances/times)
    graph.addEdge("A", "B", 4);
    graph.addEdge("A", "C", 2);
    graph.addEdge("B", "C", 1);
    graph.addEdge("B", "D", 5);
    graph.addEdge("C", "D", 8);
    graph.addEdge("C", "E", 10);
    graph.addEdge("D", "E", 2);
    
    // Display the graph
    std::cout << "\nGraph Structure:" << std::endl;
    graph.displayGraph();
    
    // Find shortest path using Dijkstra's algorithm
    Dijkstra dijkstra(graph);
    
    std::string start = "A";
    std::string end = "E";
    
    std::cout << "\nFinding shortest path from " << start << " to " << end << ":" << std::endl;
    
    auto result = dijkstra.findShortestPath(start, end);
    
    if (result.first.empty()) {
        std::cout << "No path found from " << start << " to " << end << std::endl;
    } else {
        std::cout << "Shortest path: ";
        for (size_t i = 0; i < result.first.size(); ++i) {
            std::cout << result.first[i];
            if (i < result.first.size() - 1) {
                std::cout << " -> ";
            }
        }
        std::cout << std::endl;
        std::cout << "Total distance: " << result.second << std::endl;
    }
    
    // Additional pathfinding examples
    std::cout << "\nAdditional Pathfinding Examples:" << std::endl;
    
    // Test more paths
    std::vector<std::pair<std::string, std::string>> testPaths = {
        {"A", "D"}, {"B", "E"}, {"C", "A"}
    };
    
    for (const auto& path : testPaths) {
        auto result = dijkstra.findShortestPath(path.first, path.second);
        if (!result.first.empty()) {
            std::cout << "Path from " << path.first << " to " << path.second << ": ";
            for (size_t i = 0; i < result.first.size(); ++i) {
                std::cout << result.first[i];
                if (i < result.first.size() - 1) {
                    std::cout << " -> ";
                }
            }
            std::cout << " (Distance: " << result.second << ")" << std::endl;
        }
    }
    
    // Random Point Generator Demonstration
    std::cout << "\n" << std::string(50, '=') << std::endl;
    std::cout << "Random Point Generator Demonstration" << std::endl;
    std::cout << std::string(50, '=') << std::endl;
    
    RandomPointGenerator rpg;
    
    // Test parameters
    double centerLat = 40.7128;  // New York City
    double centerLng = -74.0060;
    double radiusKm = 10.0;
    int numPoints = 1000;
    
    // Generate people
    std::cout << "Generating " << numPoints << " people within " << radiusKm << "km of NYC..." << std::endl;
    auto people = rpg.generatePointsPerformanceTest(centerLat, centerLng, radiusKm, numPoints);
    
    // Generate test centers
    int numTestCenters = 5;
    std::cout << "\nGenerating " << numTestCenters << " test centers within " << radiusKm << "km of NYC..." << std::endl;
    auto testCenters = rpg.generateTestCenters(centerLat, centerLng, radiusKm, numTestCenters);
    
    // Display statistics
    auto stats = rpg.getLastGenerationStats();
    std::cout << "\nGeneration Statistics:" << std::endl;
    std::cout << "Total Attempts: " << stats.totalAttempts << std::endl;
    std::cout << "Successful Points: " << stats.successfulPoints << std::endl;
    std::cout << "Generation Time: " << std::fixed << std::setprecision(3) 
              << stats.generationTimeMs << " ms" << std::endl;
    std::cout << "Average Distance: " << std::fixed << std::setprecision(2) 
              << stats.averageDistance << " km" << std::endl;
    std::cout << "Min Distance: " << std::fixed << std::setprecision(2) 
              << stats.minDistance << " km" << std::endl;
    std::cout << "Max Distance: " << std::fixed << std::setprecision(2) 
              << stats.maxDistance << " km" << std::endl;
    
    // Display first 5 people
    std::cout << "\nFirst 5 generated people:" << std::endl;
    for (int i = 0; i < std::min(5, (int)people.size()); ++i) {
        std::cout << "Person " << (i+1) << ": (" 
                  << std::fixed << std::setprecision(6) 
                  << people[i].latitude << ", " << people[i].longitude 
                  << ") - " << people[i].category << std::endl;
    }
    
    // Display test centers
    std::cout << "\nGenerated test centers:" << std::endl;
    for (int i = 0; i < (int)testCenters.size(); ++i) {
        std::cout << "Test Center " << (i+1) << ": (" 
                  << std::fixed << std::setprecision(6) 
                  << testCenters[i].latitude << ", " << testCenters[i].longitude << ")" << std::endl;
    }
    
    // Count people by category
    int maleCount = 0, femaleCount = 0, pwdCount = 0;
    for (const auto& person : people) {
        if (person.category == "male") maleCount++;
        else if (person.category == "female") femaleCount++;
        else if (person.category == "pwd") pwdCount++;
    }
    
    std::cout << "\nPeople Distribution:" << std::endl;
    std::cout << "Male: " << maleCount << " (" << std::fixed << std::setprecision(1) 
              << (100.0 * maleCount / people.size()) << "%)" << std::endl;
    std::cout << "Female: " << femaleCount << " (" << std::fixed << std::setprecision(1) 
              << (100.0 * femaleCount / people.size()) << "%)" << std::endl;
    std::cout << "PWD: " << pwdCount << " (" << std::fixed << std::setprecision(1) 
              << (100.0 * pwdCount / people.size()) << "%)" << std::endl;
    
    std::cout << "\nThank you for using Route Analyzer!" << std::endl;
    
    return 0;
}
