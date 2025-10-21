#ifndef ROAD_DISTANCE_SERVICE_H
#define ROAD_DISTANCE_SERVICE_H

#include <vector>
#include <string>
#include <map>
#include <chrono>
#include <functional>
#include <thread>
#include <future>
#include <iostream>
#include <sstream>
#include <curl/curl.h>
#include "AStarAlgorithm.h"

struct Point {
    double latitude;
    double longitude;
    std::string type;      // "person" or "test_center"
    std::string category;  // "male", "female", "pwd" for people; "center" for test centers

    Point(double lat = 0.0, double lng = 0.0, const std::string& t = "person", const std::string& c = "male") 
        : latitude(lat), longitude(lng), type(t), category(c) {}

    // Calculate Haversine distance to another point
    double distanceTo(const Point& other) const {
        const double R = 6371.0; // Earth's radius in km
        double dLat = degreesToRadians(other.latitude - latitude);
        double dLng = degreesToRadians(other.longitude - longitude);
        
        double a = std::sin(dLat/2) * std::sin(dLat/2) +
                   std::cos(degreesToRadians(latitude)) * std::cos(degreesToRadians(other.latitude)) *
                   std::sin(dLng/2) * std::sin(dLng/2);
        
        double c = 2 * std::atan2(std::sqrt(a), std::sqrt(1-a));
        return R * c;
    }

private:
    double degreesToRadians(double degrees) const {
        return degrees * M_PI / 180.0;
    }
};

struct CacheEntry {
    double distance;
    std::chrono::steady_clock::time_point timestamp;
    
    CacheEntry(double dist) : distance(dist), timestamp(std::chrono::steady_clock::now()) {}
    
    bool isExpired(int timeoutMs = 300000) const { // 5 minutes default
        auto now = std::chrono::steady_clock::now();
        auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(now - timestamp);
        return elapsed.count() > timeoutMs;
    }
};

class RoadDistanceService {
private:
    std::string baseUrl;
    std::map<std::string, CacheEntry> cache;
    int cacheTimeout;
    int batchSize;
    CURL* curl;
    AStarAlgorithm aStarAlgorithm;
    bool useAStar;
    
    // Progress callback function type
    std::function<void(int, int, const std::string&)> progressCallback;
    
    // HTTP response callback for libcurl
    static size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* s) {
        size_t newLength = size * nmemb;
        try {
            s->append((char*)contents, newLength);
            return newLength;
        } catch(std::bad_alloc &e) {
            return 0;
        }
    }

public:
    RoadDistanceService() 
        : baseUrl("https://router.project-osrm.org/route/v1/driving")
        , cacheTimeout(300000) // 5 minutes
        , batchSize(25)
        , curl(nullptr)
        , useAStar(true) {
        
        // Initialize libcurl
        curl_global_init(CURL_GLOBAL_DEFAULT);
        curl = curl_easy_init();
        
        if (curl) {
            curl_easy_setopt(curl, CURLOPT_TIMEOUT, 10L); // 10 second timeout
            curl_easy_setopt(curl, CURLOPT_CONNECTTIMEOUT, 5L); // 5 second connect timeout
            curl_easy_setopt(curl, CURLOPT_USERAGENT, "RouteAnalyzer/1.0");
        }
    }
    
    ~RoadDistanceService() {
        if (curl) {
            curl_easy_cleanup(curl);
        }
        curl_global_cleanup();
    }

    /**
     * Calculate road distance between two points using A* or OSRM
     * @param point1 First point
     * @param point2 Second point
     * @return Road distance in kilometers
     */
    double calculateRoadDistance(const Point& point1, const Point& point2) {
        std::string cacheKey = getCacheKey(point1, point2);
        
        // Check cache first
        auto it = cache.find(cacheKey);
        if (it != cache.end() && !it->second.isExpired(cacheTimeout)) {
            return it->second.distance;
        }
        
        try {
            double distance;
            
            // Use A* for short distances, OSRM for long distances
            if (useAStar && point1.distanceTo(point2) < 50.0) {
                distance = aStarAlgorithm.findPath(point1, point2);
            } else {
                distance = calculateOSRMDistance(point1, point2);
            }
            
            // Cache the result
            cache[cacheKey] = CacheEntry(distance);
            
            return distance;
        } catch (const std::exception& e) {
            std::cerr << "Road distance calculation failed: " << e.what() << std::endl;
            // Fallback to Haversine distance
            return point1.distanceTo(point2);
        }
    }

    /**
     * Calculate distance matrix for all people and test centers
     * @param people Vector of people points
     * @param testCenters Vector of test center points
     * @return Distance matrix [personIndex][centerIndex]
     */
    std::vector<std::vector<double>> calculateRoadDistanceMatrix(
        const std::vector<Point>& people, 
        const std::vector<Point>& testCenters) {
        
        std::vector<std::vector<double>> matrix(people.size(), std::vector<double>(testCenters.size()));
        int totalPairs = people.size() * testCenters.size();
        int processedCount = 0;
        
        std::cout << "Calculating road distances for " << totalPairs << " pairs..." << std::endl;
        
        for (size_t i = 0; i < people.size(); i++) {
            for (size_t j = 0; j < testCenters.size(); j++) {
                matrix[i][j] = calculateRoadDistance(people[i], testCenters[j]);
                processedCount++;
                
                // Update progress every 10 calculations
                if (processedCount % 10 == 0) {
                    int progress = (processedCount * 100) / totalPairs;
                    std::string message = "Processed " + std::to_string(processedCount) + 
                                        "/" + std::to_string(totalPairs) + " distances (" + 
                                        std::to_string(progress) + "%)";
                    
                    if (progressCallback) {
                        progressCallback(processedCount, totalPairs, message);
                    }
                    
                    std::cout << message << std::endl;
                }
                
                // Small delay to be respectful to the API
                if (processedCount % 25 == 0) {
                    std::this_thread::sleep_for(std::chrono::milliseconds(100));
                }
            }
        }
        
        std::cout << "Road distance matrix calculation completed!" << std::endl;
        return matrix;
    }

    /**
     * Set progress callback function
     * @param callback Function to call for progress updates
     */
    void setProgressCallback(std::function<void(int, int, const std::string&)> callback) {
        progressCallback = callback;
    }

    /**
     * Clear cache
     */
    void clearCache() {
        cache.clear();
    }

    /**
     * Get cache statistics
     * @return Cache statistics
     */
    std::map<std::string, int> getCacheStats() const {
        std::map<std::string, int> stats;
        stats["size"] = cache.size();
        stats["timeout"] = cacheTimeout;
        stats["batch_size"] = batchSize;
        return stats;
    }

private:
    /**
     * Calculate distance using OSRM API
     * @param point1 First point
     * @param point2 Second point
     * @return Distance in kilometers
     */
    double calculateOSRMDistance(const Point& point1, const Point& point2) {
        if (!curl) {
            throw std::runtime_error("CURL not initialized");
        }
        
        // Build OSRM URL
        std::ostringstream urlStream;
        urlStream << baseUrl << "/" 
                  << point1.longitude << "," << point1.latitude << ";"
                  << point2.longitude << "," << point2.latitude 
                  << "?overview=false";
        
        std::string url = urlStream.str();
        std::string response;
        
        // Set up CURL request
        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
        
        // Perform the request
        CURLcode res = curl_easy_perform(curl);
        
        if (res != CURLE_OK) {
            throw std::runtime_error("CURL error: " + std::string(curl_easy_strerror(res)));
        }
        
        // Parse JSON response (simplified)
        return parseOSRMResponse(response);
    }

    /**
     * Parse OSRM JSON response to extract distance
     * @param response JSON response string
     * @return Distance in kilometers
     */
    double parseOSRMResponse(const std::string& response) {
        // Simple JSON parsing for distance extraction
        // Look for "distance": value in the response
        size_t distancePos = response.find("\"distance\":");
        if (distancePos == std::string::npos) {
            throw std::runtime_error("Distance not found in OSRM response");
        }
        
        // Find the distance value
        size_t valueStart = response.find_first_of("0123456789", distancePos);
        size_t valueEnd = response.find_first_not_of("0123456789.", valueStart);
        
        if (valueStart == std::string::npos) {
            throw std::runtime_error("Invalid distance value in OSRM response");
        }
        
        std::string distanceStr = response.substr(valueStart, valueEnd - valueStart);
        double distanceMeters = std::stod(distanceStr);
        
        return distanceMeters / 1000.0; // Convert meters to kilometers
    }

    /**
     * Get cache key for two points
     * @param point1 First point
     * @param point2 Second point
     * @return Cache key string
     */
    std::string getCacheKey(const Point& point1, const Point& point2) const {
        // Create consistent key regardless of order
        std::ostringstream keyStream;
        
        if (point1.latitude < point2.latitude || 
            (point1.latitude == point2.latitude && point1.longitude < point2.longitude)) {
            keyStream << std::fixed << std::setprecision(6) 
                      << point1.latitude << "," << point1.longitude << "|"
                      << point2.latitude << "," << point2.longitude;
        } else {
            keyStream << std::fixed << std::setprecision(6) 
                      << point2.latitude << "," << point2.longitude << "|"
                      << point1.latitude << "," << point1.longitude;
        }
        
        return keyStream.str();
    }
};

#endif // ROAD_DISTANCE_SERVICE_H
