#include <iostream>
#include <vector>
#include <string>
#include <chrono>
#include <iomanip>
#include <random>
#include <algorithm>
#include "RandomPointGenerator.h"
#include "AssignmentAlgorithm.h"
#include "RoadDistanceService.h"
#include "AStarAlgorithm.h"

class RouteAnalyzerApp {
private:
    RandomPointGenerator rpg;
    AssignmentAlgorithm assignmentAlgorithm;
    RoadDistanceService roadDistanceService;
    std::vector<Point> people;
    std::vector<Point> testCenters;

public:
    RouteAnalyzerApp() {
        // Set up progress callback
        roadDistanceService.setProgressCallback([](int current, int total, const std::string& message) {
            std::cout << "Progress: " << message << std::endl;
        });
        
        assignmentAlgorithm.setProgressCallback([](int current, int total, const std::string& message) {
            std::cout << "Assignment: " << message << std::endl;
        });
    }

    void run() {
        std::cout << "=== Route Analyzer - C++ DSA Project ===" << std::endl;
        std::cout << "Priority-Based Assignment with Road Distance Optimization" << std::endl;
        std::cout << "========================================================" << std::endl;

        // Generate sample data
        generateSampleData();
        
        // Demonstrate both distance calculation methods
        demonstrateStraightLineAssignment();
        demonstrateRoadBasedAssignment();
        
        // Performance comparison
        performanceComparison();
        
        std::cout << "\n=== Program Completed Successfully ===" << std::endl;
    }

private:
    void generateSampleData() {
        std::cout << "\n--- Generating Sample Data ---" << std::endl;
        
        // Generate people (Male/Female/PWD)
        std::cout << "Generating 50 people..." << std::endl;
        people = rpg.generatePointsInRadius(40.7128, -74.0060, 5.0, 50, "people");
        
        // Generate test centers
        std::cout << "Generating 5 test centers..." << std::endl;
        testCenters = rpg.generateTestCenters(40.7128, -74.0060, 5.0, 5);
        
        std::cout << "Sample data generated successfully!" << std::endl;
        printDataSummary();
    }

    void demonstrateStraightLineAssignment() {
        std::cout << "\n--- Straight-Line Distance Assignment ---" << std::endl;
        
        assignmentAlgorithm.setRoadDistanceEnabled(false);
        
        auto startTime = std::chrono::high_resolution_clock::now();
        
        std::vector<AssignmentResult> results = assignmentAlgorithm.assignPeopleToTestCenters(
            people, testCenters, 10); // 10 people per center
        
        auto endTime = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime);
        
        AssignmentStats stats = assignmentAlgorithm.getAssignmentStats();
        
        std::cout << "Straight-line assignment completed in " << duration.count() << " ms" << std::endl;
        printAssignmentResults(results, stats, "straight-line");
    }

    void demonstrateRoadBasedAssignment() {
        std::cout << "\n--- Road-Based Distance Assignment ---" << std::endl;
        
        assignmentAlgorithm.setRoadDistanceEnabled(true);
        
        auto startTime = std::chrono::high_resolution_clock::now();
        
        std::vector<AssignmentResult> results = assignmentAlgorithm.assignPeopleToTestCenters(
            people, testCenters, 10, &roadDistanceService); // 10 people per center
        
        auto endTime = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(endTime - startTime);
        
        AssignmentStats stats = assignmentAlgorithm.getAssignmentStats();
        
        std::cout << "Road-based assignment completed in " << duration.count() << " ms" << std::endl;
        printAssignmentResults(results, stats, "road-based");
    }

    void performanceComparison() {
        std::cout << "\n--- Performance Comparison ---" << std::endl;
        
        // Test with different dataset sizes
        std::vector<int> peopleCounts = {10, 25, 50, 100};
        std::vector<int> centerCounts = {2, 3, 5, 10};
        
        std::cout << std::setw(10) << "People" << std::setw(10) << "Centers" 
                  << std::setw(15) << "Straight-line" << std::setw(15) << "Road-based" 
                  << std::setw(15) << "Speedup" << std::endl;
        std::cout << std::string(65, '-') << std::endl;
        
        for (int peopleCount : peopleCounts) {
            for (int centerCount : centerCounts) {
                if (peopleCount * centerCount > 200) continue; // Skip very large tests
                
                // Generate test data
                std::vector<Point> testPeople = rpg.generatePointsInRadius(40.7128, -74.0060, 3.0, peopleCount, "people");
                std::vector<Point> testCenters = rpg.generateTestCenters(40.7128, -74.0060, 3.0, centerCount);
                
                // Test straight-line
                assignmentAlgorithm.setRoadDistanceEnabled(false);
                auto start1 = std::chrono::high_resolution_clock::now();
                assignmentAlgorithm.assignPeopleToTestCenters(testPeople, testCenters, 50);
                auto end1 = std::chrono::high_resolution_clock::now();
                auto duration1 = std::chrono::duration_cast<std::chrono::milliseconds>(end1 - start1);
                
                // Test road-based
                assignmentAlgorithm.setRoadDistanceEnabled(true);
                auto start2 = std::chrono::high_resolution_clock::now();
                assignmentAlgorithm.assignPeopleToTestCenters(testPeople, testCenters, 50, &roadDistanceService);
                auto end2 = std::chrono::high_resolution_clock::now();
                auto duration2 = std::chrono::duration_cast<std::chrono::milliseconds>(end2 - start2);
                
                double speedup = (double)duration2.count() / duration1.count();
                
                std::cout << std::setw(10) << peopleCount 
                          << std::setw(10) << centerCount
                          << std::setw(15) << duration1.count() << " ms"
                          << std::setw(15) << duration2.count() << " ms"
                          << std::setw(15) << std::fixed << std::setprecision(2) << speedup << "x" << std::endl;
            }
        }
    }

    void printDataSummary() {
        std::cout << "\nData Summary:" << std::endl;
        std::cout << "People: " << people.size() << std::endl;
        
        int maleCount = 0, femaleCount = 0, pwdCount = 0;
        for (const auto& person : people) {
            if (person.category == "male") maleCount++;
            else if (person.category == "female") femaleCount++;
            else if (person.category == "pwd") pwdCount++;
        }
        
        std::cout << "  - Male: " << maleCount << std::endl;
        std::cout << "  - Female: " << femaleCount << std::endl;
        std::cout << "  - PWD: " << pwdCount << std::endl;
        std::cout << "Test Centers: " << testCenters.size() << std::endl;
    }

    void printAssignmentResults(const std::vector<AssignmentResult>& results, 
                              const AssignmentStats& stats, 
                              const std::string& distanceType) {
        std::cout << "\nAssignment Results (" << distanceType << "):" << std::endl;
        std::cout << "Total Assigned: " << stats.totalAssigned << std::endl;
        std::cout << "PWD Assigned: " << stats.pwdAssigned << std::endl;
        std::cout << "Female Assigned: " << stats.femaleAssigned << std::endl;
        std::cout << "Male Assigned: " << stats.maleAssigned << std::endl;
        std::cout << "Average Distance: " << std::fixed << std::setprecision(2) << stats.averageDistance << " km" << std::endl;
        std::cout << "Max Distance: " << std::fixed << std::setprecision(2) << stats.maxDistance << " km" << std::endl;
        std::cout << "Min Distance: " << std::fixed << std::setprecision(2) << stats.minDistance << " km" << std::endl;
        
        // Show first 10 assignments
        std::cout << "\nFirst 10 Assignments:" << std::endl;
        std::cout << std::setw(8) << "Person" << std::setw(8) << "Center" 
                  << std::setw(10) << "Category" << std::setw(12) << "Distance" << std::endl;
        std::cout << std::string(40, '-') << std::endl;
        
        for (size_t i = 0; i < std::min(results.size(), size_t(10)); i++) {
            const auto& result = results[i];
            std::cout << std::setw(8) << result.personIndex 
                      << std::setw(8) << result.centerIndex
                      << std::setw(10) << result.category
                      << std::setw(12) << std::fixed << std::setprecision(2) << result.distance << " km" << std::endl;
        }
        
        if (results.size() > 10) {
            std::cout << "... and " << (results.size() - 10) << " more assignments" << std::endl;
        }
    }
};

int main() {
    try {
        RouteAnalyzerApp app;
        app.run();
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}