#ifndef ASSIGNMENT_ALGORITHM_H
#define ASSIGNMENT_ALGORITHM_H

#include <vector>
#include <map>
#include <string>
#include <algorithm>
#include <functional>
#include <iostream>
#include "RoadDistanceService.h"

struct AssignmentResult {
    int personIndex;
    int centerIndex;
    Point person;
    Point center;
    double distance;
    std::string category;
    
    AssignmentResult(int pIdx, int cIdx, const Point& p, const Point& c, double dist, const std::string& cat)
        : personIndex(pIdx), centerIndex(cIdx), person(p), center(c), distance(dist), category(cat) {}
};

struct AssignmentStats {
    int totalAssigned;
    int pwdAssigned;
    int femaleAssigned;
    int maleAssigned;
    double averageDistance;
    double maxDistance;
    double minDistance;
    
    AssignmentStats() : totalAssigned(0), pwdAssigned(0), femaleAssigned(0), maleAssigned(0),
                       averageDistance(0), maxDistance(0), minDistance(std::numeric_limits<double>::max()) {}
};

class AssignmentAlgorithm {
private:
    std::map<int, int> assignments; // personId -> testCenterId
    std::map<int, int> testCenterCapacity; // testCenterId -> remaining capacity
    AssignmentStats assignmentStats;
    RoadDistanceService* roadDistanceService;
    bool useRoadDistances;
    
    // Progress callback function type
    std::function<void(int, int, const std::string&)> progressCallback;

public:
    AssignmentAlgorithm() : roadDistanceService(nullptr), useRoadDistances(true) {}

    /**
     * Assign people to test centers with priority
     * @param people Vector of people points
     * @param testCenters Vector of test center points
     * @param capacityPerCenter Maximum people per test center
     * @param roadService Road distance service
     * @return Assignment results
     */
    std::vector<AssignmentResult> assignPeopleToTestCenters(
        const std::vector<Point>& people, 
        const std::vector<Point>& testCenters, 
        int capacityPerCenter = 50,
        RoadDistanceService* roadService = nullptr) {
        
        // Reset assignments
        assignments.clear();
        testCenterCapacity.clear();
        
        // Set road distance service
        roadDistanceService = roadService;
        
        // Initialize test center capacities
        for (size_t i = 0; i < testCenters.size(); i++) {
            testCenterCapacity[i] = capacityPerCenter;
        }

        // Calculate all distances (road-based or Haversine)
        std::vector<std::vector<double>> distanceMatrix = calculateDistanceMatrix(people, testCenters);
        
        // Sort people by priority (PWD > Female > Male)
        std::vector<Point> sortedPeople = sortPeopleByPriority(people);
        
        // Assign people using priority-based greedy algorithm
        std::vector<AssignmentResult> assignmentResults = performPriorityAssignment(
            sortedPeople, testCenters, distanceMatrix);
        
        // Calculate statistics
        calculateAssignmentStats(assignmentResults);
        
        return assignmentResults;
    }

    /**
     * Calculate distance matrix between all people and test centers
     * @param people Vector of people
     * @param testCenters Vector of test centers
     * @return Distance matrix [personIndex][centerIndex]
     */
    std::vector<std::vector<double>> calculateDistanceMatrix(
        const std::vector<Point>& people, 
        const std::vector<Point>& testCenters) {
        
        std::vector<std::vector<double>> matrix(people.size(), std::vector<double>(testCenters.size()));
        
        if (useRoadDistances && roadDistanceService) {
            std::cout << "Calculating road-based distance matrix..." << std::endl;
            matrix = roadDistanceService->calculateRoadDistanceMatrix(people, testCenters);
        } else {
            std::cout << "Calculating straight-line distance matrix..." << std::endl;
            matrix = calculateHaversineDistanceMatrix(people, testCenters);
        }
        
        return matrix;
    }

    /**
     * Calculate Haversine distance matrix (fallback)
     * @param people Vector of people
     * @param testCenters Vector of test centers
     * @return Distance matrix [personIndex][centerIndex]
     */
    std::vector<std::vector<double>> calculateHaversineDistanceMatrix(
        const std::vector<Point>& people, 
        const std::vector<Point>& testCenters) {
        
        std::vector<std::vector<double>> matrix(people.size(), std::vector<double>(testCenters.size()));
        
        for (size_t i = 0; i < people.size(); i++) {
            for (size_t j = 0; j < testCenters.size(); j++) {
                matrix[i][j] = people[i].distanceTo(testCenters[j]);
            }
        }
        
        return matrix;
    }

    /**
     * Sort people by priority (PWD > Female > Male)
     * @param people Vector of people
     * @return Sorted people vector
     */
    std::vector<Point> sortPeopleByPriority(const std::vector<Point>& people) {
        std::vector<Point> sortedPeople = people;
        
        std::sort(sortedPeople.begin(), sortedPeople.end(), [](const Point& a, const Point& b) {
            std::map<std::string, int> priorityOrder = {{"pwd", 1}, {"female", 2}, {"male", 3}};
            return priorityOrder[a.category] < priorityOrder[b.category];
        });
        
        return sortedPeople;
    }

    /**
     * Perform priority-based assignment
     * @param sortedPeople People sorted by priority
     * @param testCenters Test centers
     * @param distanceMatrix Pre-calculated distance matrix
     * @return Assignment results
     */
    std::vector<AssignmentResult> performPriorityAssignment(
        const std::vector<Point>& sortedPeople, 
        const std::vector<Point>& testCenters, 
        const std::vector<std::vector<double>>& distanceMatrix) {
        
        std::vector<AssignmentResult> results;
        
        for (const Point& person : sortedPeople) {
            // Find original index of this person
            int originalPersonIndex = findPersonIndex(person, sortedPeople);
            
            // Find best available test center for this person
            auto bestAssignment = findBestAvailableCenter(originalPersonIndex, testCenters, distanceMatrix);
            
            if (bestAssignment.first != -1) {
                int centerIndex = bestAssignment.first;
                double distance = bestAssignment.second;
                
                // Make assignment
                assignments[originalPersonIndex] = centerIndex;
                testCenterCapacity[centerIndex]--;
                
                results.emplace_back(originalPersonIndex, centerIndex, person, 
                                   testCenters[centerIndex], distance, person.category);
            }
        }
        
        return results;
    }

    /**
     * Find best available test center for a person
     * @param personIndex Person index
     * @param testCenters Test centers
     * @param distanceMatrix Distance matrix
     * @return Pair of (centerIndex, distance) or (-1, -1) if none available
     */
    std::pair<int, double> findBestAvailableCenter(
        int personIndex, 
        const std::vector<Point>& testCenters, 
        const std::vector<std::vector<double>>& distanceMatrix) {
        
        int bestCenter = -1;
        double bestDistance = std::numeric_limits<double>::max();
        
        for (size_t centerIndex = 0; centerIndex < testCenters.size(); centerIndex++) {
            // Check if center has capacity
            if (testCenterCapacity[centerIndex] > 0) {
                double distance = distanceMatrix[personIndex][centerIndex];
                
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestCenter = centerIndex;
                }
            }
        }
        
        return (bestCenter != -1) ? std::make_pair(bestCenter, bestDistance) : std::make_pair(-1, -1);
    }

    /**
     * Find person index in original vector
     * @param person Person to find
     * @param people Vector of people
     * @return Index of person
     */
    int findPersonIndex(const Point& person, const std::vector<Point>& people) {
        for (size_t i = 0; i < people.size(); i++) {
            if (std::abs(people[i].latitude - person.latitude) < 1e-6 &&
                std::abs(people[i].longitude - person.longitude) < 1e-6 &&
                people[i].category == person.category) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Calculate assignment statistics
     * @param assignmentResults Assignment results
     */
    void calculateAssignmentStats(const std::vector<AssignmentResult>& assignmentResults) {
        assignmentStats.totalAssigned = assignmentResults.size();
        assignmentStats.pwdAssigned = 0;
        assignmentStats.femaleAssigned = 0;
        assignmentStats.maleAssigned = 0;
        
        double totalDistance = 0;
        std::vector<double> distances;
        
        for (const auto& result : assignmentResults) {
            // Count by category
            if (result.category == "pwd") {
                assignmentStats.pwdAssigned++;
            } else if (result.category == "female") {
                assignmentStats.femaleAssigned++;
            } else if (result.category == "male") {
                assignmentStats.maleAssigned++;
            }
            
            totalDistance += result.distance;
            distances.push_back(result.distance);
        }
        
        // Calculate distance statistics
        if (!distances.empty()) {
            assignmentStats.averageDistance = totalDistance / distances.size();
            assignmentStats.maxDistance = *std::max_element(distances.begin(), distances.end());
            assignmentStats.minDistance = *std::min_element(distances.begin(), distances.end());
        }
    }

    /**
     * Enable or disable road distance calculation
     * @param enabled Whether to use road distances
     */
    void setRoadDistanceEnabled(bool enabled) {
        useRoadDistances = enabled;
    }

    /**
     * Check if road distances are enabled
     * @return True if road distances are enabled
     */
    bool isRoadDistanceEnabled() const {
        return useRoadDistances;
    }

    /**
     * Get assignment statistics
     * @return Assignment statistics
     */
    AssignmentStats getAssignmentStats() const {
        return assignmentStats;
    }

    /**
     * Get assignments map
     * @return Assignments map
     */
    std::map<int, int> getAssignments() const {
        return assignments;
    }

    /**
     * Clear all assignments
     */
    void clearAssignments() {
        assignments.clear();
        testCenterCapacity.clear();
        assignmentStats = AssignmentStats();
    }

    /**
     * Set progress callback function
     * @param callback Function to call for progress updates
     */
    void setProgressCallback(std::function<void(int, int, const std::string&)> callback) {
        progressCallback = callback;
    }

    /**
     * Get algorithm complexity information
     * @return Complexity information
     */
    std::map<std::string, std::string> getComplexityInfo() const {
        std::map<std::string, std::string> info;
        info["time_complexity"] = useRoadDistances ? "O(P * C * R) + O(P log P)" : "O(P * C + P log P)";
        info["space_complexity"] = "O(P * C)";
        info["description"] = useRoadDistances ? 
            "Priority-based greedy assignment with road distance optimization" :
            "Priority-based greedy assignment with straight-line distance optimization";
        return info;
    }
};

#endif // ASSIGNMENT_ALGORITHM_H
