#ifndef RANDOM_POINT_GENERATOR_H
#define RANDOM_POINT_GENERATOR_H

#include <vector>
#include <random>
#include <cmath>
#include <chrono>
#include <functional>

struct Point {
    double latitude;
    double longitude;
    std::string type;      // "person" or "test_center"
    std::string category;  // "male", "female", "pwd" for people; "center" for test centers

    Point(double lat = 0.0, double lng = 0.0, const std::string& t = "person", const std::string& c = "male") 
        : latitude(lat), longitude(lng), type(t), category(c) {}
};

class RandomPointGenerator {
private:
    mutable std::mt19937 generator;
    mutable std::uniform_real_distribution<double> uniform_dist;
    
    // Earth's radius in kilometers
    static constexpr double EARTH_RADIUS_KM = 6371.0;
    
    // Convert kilometers to degrees (approximate)
    static constexpr double KM_TO_DEGREES = 1.0 / 111.0;
    
public:
    // Constructor with optional seed
    RandomPointGenerator(unsigned int seed = std::chrono::high_resolution_clock::now().time_since_epoch().count());
    
    // Destructor
    ~RandomPointGenerator();
    
    // Generate random points within a circular radius
    std::vector<Point> generatePointsInRadius(double centerLat, double centerLng, 
                                             double radiusKm, int numPoints, 
                                             const std::string& pointType = "people");
    
    // Generate test centers
    std::vector<Point> generateTestCenters(double centerLat, double centerLng, 
                                          double radiusKm, int numCenters);
    
    // Get random person category
    std::string getRandomPersonCategory() const;
    
    // Generate a single random point within radius using rejection sampling
    Point generateSinglePoint(double centerLat, double centerLng, double radiusKm);
    
    // Calculate distance between two points using Haversine formula
    double calculateDistance(double lat1, double lng1, double lat2, double lng2) const;
    
    // Validate if a point is within reasonable geographic bounds
    bool isValidPoint(double lat, double lng) const;
    
    // Generate points with custom validation function
    std::vector<Point> generatePointsWithValidation(double centerLat, double centerLng,
                                                   double radiusKm, int numPoints,
                                                   std::function<bool(double, double)> validator);
    
    // Performance testing - generate large number of points
    std::vector<Point> generatePointsPerformanceTest(double centerLat, double centerLng,
                                                   double radiusKm, int numPoints);
    
    // Get generation statistics
    struct GenerationStats {
        int totalAttempts;
        int successfulPoints;
        double generationTimeMs;
        double averageDistance;
        double minDistance;
        double maxDistance;
    };
    
    GenerationStats getLastGenerationStats() const;
    
private:
    mutable GenerationStats lastStats;
    
    // Helper function to convert degrees to radians
    double degreesToRadians(double degrees) const;
    
    // Helper function to convert radians to degrees
    double radiansToDegrees(double radians) const;
    
    // Generate random angle and distance for point generation
    std::pair<double, double> generateRandomAngleAndDistance(double maxRadiusKm) const;
};

#endif // RANDOM_POINT_GENERATOR_H
