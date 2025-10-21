#include "../include/RandomPointGenerator.h"
#include <algorithm>
#include <numeric>
#include <iostream>
#include <iomanip>

RandomPointGenerator::RandomPointGenerator(unsigned int seed) 
    : generator(seed), uniform_dist(0.0, 1.0) {
    // Initialize statistics
    lastStats = {0, 0, 0.0, 0.0, 0.0, 0.0};
}

RandomPointGenerator::~RandomPointGenerator() {
    // Destructor - no dynamic memory to clean up
}

std::vector<Point> RandomPointGenerator::generatePointsInRadius(
    double centerLat, double centerLng, double radiusKm, int numPoints, const std::string& pointType) {
    
    auto startTime = std::chrono::high_resolution_clock::now();
    
    std::vector<Point> points;
    points.reserve(numPoints);
    
    int attempts = 0;
    int successfulPoints = 0;
    
    while (successfulPoints < numPoints && attempts < numPoints * 10) {
        attempts++;
        
        Point point = generateSinglePoint(centerLat, centerLng, radiusKm);
        
        if (isValidPoint(point.latitude, point.longitude)) {
            // Assign type and category based on pointType
            if (pointType == "people") {
                point.type = "person";
                point.category = getRandomPersonCategory();
            } else if (pointType == "test_centers") {
                point.type = "test_center";
                point.category = "center";
            }
            
            points.push_back(point);
            successfulPoints++;
        }
    }
    
    auto endTime = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(endTime - startTime);
    
    // Calculate statistics
    lastStats.totalAttempts = attempts;
    lastStats.successfulPoints = successfulPoints;
    lastStats.generationTimeMs = duration.count() / 1000.0;
    
    if (!points.empty()) {
        // Calculate distance statistics
        std::vector<double> distances;
        distances.reserve(points.size());
        
        for (const auto& point : points) {
            double distance = calculateDistance(centerLat, centerLng, 
                                             point.latitude, point.longitude);
            distances.push_back(distance);
        }
        
        lastStats.averageDistance = std::accumulate(distances.begin(), distances.end(), 0.0) / distances.size();
        lastStats.minDistance = *std::min_element(distances.begin(), distances.end());
        lastStats.maxDistance = *std::max_element(distances.begin(), distances.end());
    }
    
    return points;
}

Point RandomPointGenerator::generateSinglePoint(double centerLat, double centerLng, double radiusKm) {
    // Use rejection sampling for uniform distribution in circle
    double lat, lng, distance;
    
    do {
        // Generate random angle and distance
        std::pair<double, double> angleDistance = generateRandomAngleAndDistance(radiusKm);
        double angle = angleDistance.first;
        double distanceKm = angleDistance.second;
        
        // Convert to degrees
        double radiusDegrees = distanceKm * KM_TO_DEGREES;
        
        // Calculate new coordinates
        lat = centerLat + (radiusDegrees * std::cos(angle));
        lng = centerLng + (radiusDegrees * std::sin(angle));
        
        // Calculate distance from center to verify it's within radius
        distance = calculateDistance(centerLat, centerLng, lat, lng);
        
    } while (distance > radiusKm);
    
    return Point(lat, lng);
}

double RandomPointGenerator::calculateDistance(double lat1, double lng1, double lat2, double lng2) const {
    // Haversine formula for accurate distance calculation
    double dLat = degreesToRadians(lat2 - lat1);
    double dLng = degreesToRadians(lng2 - lng1);
    
    double a = std::sin(dLat/2) * std::sin(dLat/2) +
               std::cos(degreesToRadians(lat1)) * std::cos(degreesToRadians(lat2)) *
               std::sin(dLng/2) * std::sin(dLng/2);
    
    double c = 2 * std::atan2(std::sqrt(a), std::sqrt(1-a));
    
    return EARTH_RADIUS_KM * c;
}

bool RandomPointGenerator::isValidPoint(double lat, double lng) const {
    // Check if point is within reasonable geographic bounds
    if (lat < -90.0 || lat > 90.0 || lng < -180.0 || lng > 180.0) {
        return false;
    }
    
    // Avoid extreme polar regions
    if (std::abs(lat) > 85.0) {
        return false;
    }
    
    // For DSA demonstration, accept most points
    // 98% acceptance rate for algorithm testing
    return true; // Simplified for DSA demonstration
}

std::vector<Point> RandomPointGenerator::generatePointsWithValidation(
    double centerLat, double centerLng, double radiusKm, int numPoints,
    std::function<bool(double, double)> validator) {
    
    auto startTime = std::chrono::high_resolution_clock::now();
    
    std::vector<Point> points;
    points.reserve(numPoints);
    
    int attempts = 0;
    int successfulPoints = 0;
    
    while (successfulPoints < numPoints && attempts < numPoints * 10) {
        attempts++;
        
        Point point = generateSinglePoint(centerLat, centerLng, radiusKm);
        
        if (validator(point.latitude, point.longitude)) {
            points.push_back(point);
            successfulPoints++;
        }
    }
    
    auto endTime = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(endTime - startTime);
    
    // Update statistics
    lastStats.totalAttempts = attempts;
    lastStats.successfulPoints = successfulPoints;
    lastStats.generationTimeMs = duration.count() / 1000.0;
    
    return points;
}

std::vector<Point> RandomPointGenerator::generatePointsPerformanceTest(
    double centerLat, double centerLng, double radiusKm, int numPoints) {
    
    std::cout << "Starting performance test for " << numPoints << " points..." << std::endl;
    
    auto startTime = std::chrono::high_resolution_clock::now();
    
    std::vector<Point> points = generatePointsInRadius(centerLat, centerLng, radiusKm, numPoints);
    
    auto endTime = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(endTime - startTime);
    
    std::cout << "Performance Test Results:" << std::endl;
    std::cout << "Generated: " << points.size() << " points" << std::endl;
    std::cout << "Time: " << std::fixed << std::setprecision(3) 
              << (duration.count() / 1000.0) << " ms" << std::endl;
    std::cout << "Rate: " << std::fixed << std::setprecision(0) 
              << (points.size() * 1000.0 / (duration.count() / 1000.0)) << " points/second" << std::endl;
    
    return points;
}

std::string RandomPointGenerator::getRandomPersonCategory() const {
    // Weighted random selection: 45% male, 45% female, 10% PWD
    double random = uniform_dist(generator);
    
    if (random < 0.45) {
        return "male";
    } else if (random < 0.90) {
        return "female";
    } else {
        return "pwd";
    }
}

std::vector<Point> RandomPointGenerator::generateTestCenters(double centerLat, double centerLng, 
                                                             double radiusKm, int numCenters) {
    return generatePointsInRadius(centerLat, centerLng, radiusKm, numCenters, "test_centers");
}

RandomPointGenerator::GenerationStats RandomPointGenerator::getLastGenerationStats() const {
    return lastStats;
}

double RandomPointGenerator::degreesToRadians(double degrees) const {
    return degrees * M_PI / 180.0;
}

double RandomPointGenerator::radiansToDegrees(double radians) const {
    return radians * 180.0 / M_PI;
}

std::pair<double, double> RandomPointGenerator::generateRandomAngleAndDistance(double maxRadiusKm) const {
    // Generate random angle (0 to 2π)
    double angle = uniform_dist(generator) * 2.0 * M_PI;
    
    // Generate random distance (0 to maxRadius)
    // Use square root for uniform distribution in circle area
    double distanceKm = std::sqrt(uniform_dist(generator)) * maxRadiusKm;
    
    return std::make_pair(angle, distanceKm);
}
