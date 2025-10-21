#ifndef ASTAR_ALGORITHM_H
#define ASTAR_ALGORITHM_H

#include <vector>
#include <map>
#include <set>
#include <queue>
#include <cmath>
#include <algorithm>
#include <iostream>
#include <chrono>
#include "RandomPointGenerator.h"

struct GridCell {
    int x, y;
    
    GridCell(int x = 0, int y = 0) : x(x), y(y) {}
    
    bool operator==(const GridCell& other) const {
        return x == other.x && y == other.y;
    }
    
    bool operator<(const GridCell& other) const {
        return x < other.x || (x == other.x && y < other.y);
    }
};

struct AStarNode {
    GridCell cell;
    double gScore;
    double fScore;
    
    AStarNode(const GridCell& c, double g, double f) : cell(c), gScore(g), fScore(f) {}
    
    bool operator>(const AStarNode& other) const {
        return fScore > other.fScore;
    }
};

class AStarAlgorithm {
private:
    double gridSize; // Grid resolution in degrees
    double maxDistance; // Max distance in km for A* search
    std::map<std::string, double> cache; // Cache for calculated routes
    
    // Progress callback function type
    std::function<void(int, int, const std::string&)> progressCallback;

public:
    AStarAlgorithm() : gridSize(0.001), maxDistance(100.0) {} // 100m grid, 100km max

    /**
     * Find shortest path using A* algorithm
     * @param start Start point
     * @param goal Goal point
     * @return Distance in kilometers
     */
    double findPath(const Point& start, const Point& goal) {
        // If distance is too large, fall back to OSRM
        double straightDistance = start.distanceTo(goal);
        if (straightDistance > maxDistance) {
            return fallbackToOSRM(start, goal);
        }

        // Check cache first
        std::string cacheKey = getCacheKey(start, goal);
        if (cache.find(cacheKey) != cache.end()) {
            return cache[cacheKey];
        }

        try {
            // Create grid-based pathfinding
            auto grid = createGrid(start, goal);
            auto path = aStarSearch(grid, start, goal);
            
            if (path.empty()) {
                // Fallback to OSRM if A* fails
                return fallbackToOSRM(start, goal);
            }

            double distance = calculatePathDistance(path);
            
            // Cache the result
            cache[cacheKey] = distance;
            
            return distance;
        } catch (const std::exception& e) {
            std::cerr << "A* pathfinding failed: " << e.what() << std::endl;
            return fallbackToOSRM(start, goal);
        }
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
        stats["max_distance"] = static_cast<int>(maxDistance);
        stats["grid_size"] = static_cast<int>(gridSize * 1000); // Convert to meters
        return stats;
    }

private:
    struct Grid {
        int width, height;
        GridCell start, goal;
        double west, east, south, north;
        std::set<std::string> obstacles; // For future obstacle detection
    };

    /**
     * Create grid for A* search with obstacle avoidance
     * @param start Start point
     * @param goal Goal point
     * @return Grid object
     */
    Grid createGrid(const Point& start, const Point& goal) {
        double margin = 0.005; // 500m margin
        
        Grid grid;
        grid.west = std::min(start.longitude, goal.longitude) - margin;
        grid.east = std::max(start.longitude, goal.longitude) + margin;
        grid.south = std::min(start.latitude, goal.latitude) - margin;
        grid.north = std::max(start.latitude, goal.latitude) + margin;
        
        grid.width = static_cast<int>(std::ceil((grid.east - grid.west) / gridSize));
        grid.height = static_cast<int>(std::ceil((grid.north - grid.south) / gridSize));
        
        grid.start = pointToGrid(start, grid);
        grid.goal = pointToGrid(goal, grid);
        
        return grid;
    }

    /**
     * Convert point to grid coordinates
     * @param point Point to convert
     * @param grid Grid object
     * @return Grid coordinates
     */
    GridCell pointToGrid(const Point& point, const Grid& grid) {
        return GridCell(
            static_cast<int>((point.longitude - grid.west) / gridSize),
            static_cast<int>((point.latitude - grid.south) / gridSize)
        );
    }

    /**
     * Convert grid coordinates to point
     * @param cell Grid coordinates
     * @param grid Grid object
     * @return Point object
     */
    Point gridToPoint(const GridCell& cell, const Grid& grid) {
        return Point(
            grid.south + cell.y * gridSize,
            grid.west + cell.x * gridSize
        );
    }

    /**
     * A* search algorithm with optimized heuristics
     * @param grid Grid object
     * @param start Start point
     * @param goal Goal point
     * @return Path array
     */
    std::vector<GridCell> aStarSearch(const Grid& grid, const Point& start, const Point& goal) {
        std::priority_queue<AStarNode, std::vector<AStarNode>, std::greater<AStarNode>> openSet;
        std::map<std::string, GridCell> cameFrom;
        std::map<std::string, double> gScore;
        std::map<std::string, double> fScore;

        // Initialize scores
        std::string startKey = gridKey(grid.start);
        gScore[startKey] = 0.0;
        fScore[startKey] = heuristic(grid.start, grid.goal);
        
        openSet.push(AStarNode(grid.start, gScore[startKey], fScore[startKey]));

        while (!openSet.empty()) {
            AStarNode current = openSet.top();
            openSet.pop();

            if (current.cell == grid.goal) {
                return reconstructPath(cameFrom, current.cell, grid);
            }

            // Check neighbors
            auto neighbors = getNeighbors(current.cell, grid);
            for (const auto& neighbor : neighbors) {
                std::string neighborKey = gridKey(neighbor);
                double tentativeGScore = gScore[gridKey(current.cell)] + 
                    distance(current.cell, neighbor);

                if (gScore.find(neighborKey) == gScore.end() || 
                    tentativeGScore < gScore[neighborKey]) {
                    
                    cameFrom[neighborKey] = current.cell;
                    gScore[neighborKey] = tentativeGScore;
                    fScore[neighborKey] = tentativeGScore + heuristic(neighbor, grid.goal);

                    openSet.push(AStarNode(neighbor, gScore[neighborKey], fScore[neighborKey]));
                }
            }
        }

        return {}; // No path found
    }

    /**
     * Get neighbors of a grid cell with diagonal movement
     * @param cell Grid cell
     * @param grid Grid object
     * @return Array of neighbors
     */
    std::vector<GridCell> getNeighbors(const GridCell& cell, const Grid& grid) {
        std::vector<GridCell> neighbors;
        std::vector<std::pair<int, int>> directions = {
            {-1, -1}, {-1, 0}, {-1, 1},
            {0, -1},           {0, 1},
            {1, -1},  {1, 0},  {1, 1}
        };

        for (const auto& [dx, dy] : directions) {
            GridCell neighbor(cell.x + dx, cell.y + dy);
            if (isValidCell(neighbor, grid)) {
                neighbors.push_back(neighbor);
            }
        }

        return neighbors;
    }

    /**
     * Check if cell is valid and not blocked
     * @param cell Grid cell
     * @param grid Grid object
     * @return True if valid
     */
    bool isValidCell(const GridCell& cell, const Grid& grid) {
        // Check bounds
        if (cell.x < 0 || cell.x >= grid.width || cell.y < 0 || cell.y >= grid.height) {
            return false;
        }

        // Check for obstacles (future enhancement)
        std::string cellKey = gridKey(cell);
        if (grid.obstacles.find(cellKey) != grid.obstacles.end()) {
            return false;
        }

        return true;
    }

    /**
     * Heuristic function (Euclidean distance with geographic scaling)
     * @param a First point
     * @param b Second point
     * @return Heuristic value
     */
    double heuristic(const GridCell& a, const GridCell& b) {
        double dx = a.x - b.x;
        double dy = a.y - b.y;
        return std::sqrt(dx * dx + dy * dy) * gridSize * 111; // Convert to km
    }

    /**
     * Distance between two grid cells
     * @param a First cell
     * @param b Second cell
     * @return Distance in km
     */
    double distance(const GridCell& a, const GridCell& b) {
        double dx = a.x - b.x;
        double dy = a.y - b.y;
        bool isDiagonal = std::abs(dx) == 1 && std::abs(dy) == 1;
        double baseDistance = std::sqrt(dx * dx + dy * dy);
        return baseDistance * gridSize * 111 * (isDiagonal ? 1.414 : 1); // Diagonal cost
    }

    /**
     * Create grid key for Map
     * @param cell Grid cell
     * @return Grid key
     */
    std::string gridKey(const GridCell& cell) {
        return std::to_string(cell.x) + "," + std::to_string(cell.y);
    }

    /**
     * Reconstruct path from cameFrom map
     * @param cameFrom Came from map
     * @param current Current cell
     * @param grid Grid object
     * @return Path array
     */
    std::vector<GridCell> reconstructPath(const std::map<std::string, GridCell>& cameFrom, 
                                         const GridCell& current, const Grid& grid) {
        std::vector<GridCell> path = {current};
        GridCell currentCell = current;
        
        while (cameFrom.find(gridKey(currentCell)) != cameFrom.end()) {
            currentCell = cameFrom.at(gridKey(currentCell));
            path.insert(path.begin(), currentCell);
        }

        return path;
    }

    /**
     * Calculate total distance of path
     * @param path Path array
     * @param grid Grid object
     * @return Total distance in km
     */
    double calculatePathDistance(const std::vector<GridCell>& path) {
        if (path.size() < 2) return 0;

        double totalDistance = 0;
        for (size_t i = 1; i < path.size(); i++) {
            // Create temporary points for distance calculation
            Point point1(0, 0); // Will be calculated properly in real implementation
            Point point2(0, 0);
            
            // For now, use grid distance approximation
            double dx = path[i].x - path[i-1].x;
            double dy = path[i].y - path[i-1].y;
            totalDistance += std::sqrt(dx * dx + dy * dy) * gridSize * 111;
        }

        return totalDistance;
    }

    /**
     * Fallback to OSRM for long distances
     * @param start Start point
     * @param goal Goal point
     * @return Distance in km
     */
    double fallbackToOSRM(const Point& start, const Point& goal) {
        // For now, fallback to Haversine distance
        // In a full implementation, this would make HTTP requests to OSRM
        return start.distanceTo(goal);
    }

    /**
     * Get cache key for two points
     * @param point1 First point
     * @param point2 Second point
     * @return Cache key
     */
    std::string getCacheKey(const Point& point1, const Point& point2) {
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

#endif // ASTAR_ALGORITHM_H
