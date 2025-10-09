#include <iostream>
#include <vector>
#include <string>
#include "include/Graph.h"
#include "include/Dijkstra.h"

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
    
    // Interactive mode
    std::cout << "\nInteractive Mode (enter 'quit' to exit):" << std::endl;
    std::string input_start, input_end;
    
    while (true) {
        std::cout << "\nEnter start vertex: ";
        std::cin >> input_start;
        
        if (input_start == "quit") {
            break;
        }
        
        std::cout << "Enter end vertex: ";
        std::cin >> input_end;
        
        if (input_end == "quit") {
            break;
        }
        
        auto path_result = dijkstra.findShortestPath(input_start, input_end);
        
        if (path_result.first.empty()) {
            std::cout << "No path found from " << input_start << " to " << input_end << std::endl;
        } else {
            std::cout << "Shortest path: ";
            for (size_t i = 0; i < path_result.first.size(); ++i) {
                std::cout << path_result.first[i];
                if (i < path_result.first.size() - 1) {
                    std::cout << " -> ";
                }
            }
            std::cout << std::endl;
            std::cout << "Total distance: " << path_result.second << std::endl;
        }
    }
    
    std::cout << "Thank you for using Fastest Route Analyzer!" << std::endl;
    
    return 0;
}
