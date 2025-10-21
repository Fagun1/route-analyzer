/**
 * A* Algorithm Implementation for Route Calculation
 * Fast pathfinding algorithm optimized for geographic routing
 */

class AStarAlgorithm {
    constructor() {
        this.gridSize = 0.001; // Grid resolution in degrees (about 100m)
        this.maxDistance = 100; // Max distance in km for A* search
        this.cache = new Map(); // Cache for calculated routes
    }

    /**
     * Find shortest path using A* algorithm
     * @param {Point} start - Start point
     * @param {Point} goal - Goal point
     * @returns {Promise<number>} Distance in kilometers
     */
    async findPath(start, goal) {
        // If distance is too large, fall back to OSRM
        const straightDistance = start.distanceTo(goal);
        if (straightDistance > this.maxDistance) {
            return await this.fallbackToOSRM(start, goal);
        }

        // Check cache first
        const cacheKey = this.getCacheKey(start, goal);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            // Create grid-based pathfinding
            const grid = this.createGrid(start, goal);
            const path = this.aStarSearch(grid, start, goal);
            
            if (path.length === 0) {
                // Fallback to OSRM if A* fails
                return await this.fallbackToOSRM(start, goal);
            }

            const distance = this.calculatePathDistance(path);
            
            // Cache the result
            this.cache.set(cacheKey, distance);
            
            return distance;
        } catch (error) {
            console.warn('A* pathfinding failed:', error);
            return await this.fallbackToOSRM(start, goal);
        }
    }

    /**
     * Create grid for A* search with obstacle avoidance
     * @param {Point} start - Start point
     * @param {Point} goal - Goal point
     * @returns {Object} Grid object
     */
    createGrid(start, goal) {
        const bounds = this.calculateBounds(start, goal);
        const grid = {
            width: Math.ceil((bounds.east - bounds.west) / this.gridSize),
            height: Math.ceil((bounds.north - bounds.south) / this.gridSize),
            start: this.pointToGrid(start, bounds),
            goal: this.pointToGrid(goal, bounds),
            bounds: bounds,
            obstacles: new Set() // For future obstacle detection
        };

        return grid;
    }

    /**
     * Calculate bounds for grid with margin
     * @param {Point} start - Start point
     * @param {Point} goal - Goal point
     * @returns {Object} Bounds object
     */
    calculateBounds(start, goal) {
        const margin = 0.005; // 500m margin
        return {
            west: Math.min(start.longitude, goal.longitude) - margin,
            east: Math.max(start.longitude, goal.longitude) + margin,
            south: Math.min(start.latitude, goal.latitude) - margin,
            north: Math.max(start.latitude, goal.latitude) + margin
        };
    }

    /**
     * Convert point to grid coordinates
     * @param {Point} point - Point to convert
     * @param {Object} bounds - Grid bounds
     * @returns {Object} Grid coordinates
     */
    pointToGrid(point, bounds) {
        return {
            x: Math.floor((point.longitude - bounds.west) / this.gridSize),
            y: Math.floor((point.latitude - bounds.south) / this.gridSize)
        };
    }

    /**
     * Convert grid coordinates to point
     * @param {Object} grid - Grid coordinates
     * @param {Object} bounds - Grid bounds
     * @returns {Point} Point object
     */
    gridToPoint(grid, bounds) {
        return new Point(
            bounds.south + grid.y * this.gridSize,
            bounds.west + grid.x * this.gridSize
        );
    }

    /**
     * A* search algorithm with optimized heuristics
     * @param {Object} grid - Grid object
     * @param {Point} start - Start point
     * @param {Point} goal - Goal point
     * @returns {Array} Path array
     */
    aStarSearch(grid, start, goal) {
        const openSet = [grid.start];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        // Initialize scores
        gScore.set(this.gridKey(grid.start), 0);
        fScore.set(this.gridKey(grid.start), this.heuristic(grid.start, grid.goal));

        while (openSet.length > 0) {
            // Find node with lowest fScore
            let current = openSet.reduce((min, node) => 
                fScore.get(this.gridKey(node)) < fScore.get(this.gridKey(min)) ? node : min
            );

            if (this.gridKey(current) === this.gridKey(grid.goal)) {
                return this.reconstructPath(cameFrom, current, grid);
            }

            // Remove current from openSet
            openSet.splice(openSet.indexOf(current), 1);

            // Check neighbors
            const neighbors = this.getNeighbors(current, grid);
            for (const neighbor of neighbors) {
                const tentativeGScore = gScore.get(this.gridKey(current)) + 
                    this.distance(current, neighbor);

                if (!gScore.has(this.gridKey(neighbor)) || 
                    tentativeGScore < gScore.get(this.gridKey(neighbor))) {
                    
                    cameFrom.set(this.gridKey(neighbor), current);
                    gScore.set(this.gridKey(neighbor), tentativeGScore);
                    fScore.set(this.gridKey(neighbor), 
                        tentativeGScore + this.heuristic(neighbor, grid.goal));

                    if (!openSet.some(node => this.gridKey(node) === this.gridKey(neighbor))) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        return []; // No path found
    }

    /**
     * Get neighbors of a grid cell with diagonal movement
     * @param {Object} cell - Grid cell
     * @param {Object} grid - Grid object
     * @returns {Array} Array of neighbors
     */
    getNeighbors(cell, grid) {
        const neighbors = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (const [dx, dy] of directions) {
            const neighbor = { x: cell.x + dx, y: cell.y + dy };
            if (this.isValidCell(neighbor, grid)) {
                neighbors.push(neighbor);
            }
        }

        return neighbors;
    }

    /**
     * Check if cell is valid and not blocked
     * @param {Object} cell - Grid cell
     * @param {Object} grid - Grid object
     * @returns {boolean} True if valid
     */
    isValidCell(cell, grid) {
        // Check bounds
        if (cell.x < 0 || cell.x >= grid.width || cell.y < 0 || cell.y >= grid.height) {
            return false;
        }

        // Check for obstacles (future enhancement)
        const cellKey = this.gridKey(cell);
        if (grid.obstacles && grid.obstacles.has(cellKey)) {
            return false;
        }

        return true;
    }

    /**
     * Heuristic function (Euclidean distance with geographic scaling)
     * @param {Object} a - First point
     * @param {Object} b - Second point
     * @returns {number} Heuristic value
     */
    heuristic(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy) * this.gridSize * 111; // Convert to km
    }

    /**
     * Distance between two grid cells
     * @param {Object} a - First cell
     * @param {Object} b - Second cell
     * @returns {number} Distance in km
     */
    distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const isDiagonal = Math.abs(dx) === 1 && Math.abs(dy) === 1;
        const baseDistance = Math.sqrt(dx * dx + dy * dy);
        return baseDistance * this.gridSize * 111 * (isDiagonal ? 1.414 : 1); // Diagonal cost
    }

    /**
     * Create grid key for Map
     * @param {Object} cell - Grid cell
     * @returns {string} Grid key
     */
    gridKey(cell) {
        return `${cell.x},${cell.y}`;
    }

    /**
     * Reconstruct path from cameFrom map
     * @param {Map} cameFrom - Came from map
     * @param {Object} current - Current cell
     * @param {Object} grid - Grid object
     * @returns {Array} Path array
     */
    reconstructPath(cameFrom, current, grid) {
        const path = [current];
        
        while (cameFrom.has(this.gridKey(current))) {
            current = cameFrom.get(this.gridKey(current));
            path.unshift(current);
        }

        // Add grid bounds to each path element for distance calculation
        path.forEach(cell => {
            cell.bounds = grid.bounds;
        });

        return path;
    }

    /**
     * Calculate total distance of path
     * @param {Array} path - Path array
     * @returns {number} Total distance in km
     */
    calculatePathDistance(path) {
        if (path.length < 2) return 0;

        let totalDistance = 0;
        for (let i = 1; i < path.length; i++) {
            // Use grid distance approximation instead of converting to points
            const dx = path[i].x - path[i-1].x;
            const dy = path[i].y - path[i-1].y;
            const isDiagonal = Math.abs(dx) === 1 && Math.abs(dy) === 1;
            const baseDistance = Math.sqrt(dx * dx + dy * dy);
            totalDistance += baseDistance * this.gridSize * 111 * (isDiagonal ? 1.414 : 1);
        }

        return totalDistance;
    }

    /**
     * Fallback to OSRM for long distances
     * @param {Point} start - Start point
     * @param {Point} goal - Goal point
     * @returns {Promise<number>} Distance in km
     */
    async fallbackToOSRM(start, goal) {
        try {
            const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${goal.longitude},${goal.latitude}?overview=false`
            );
            const data = await response.json();
            
            if (data.routes && data.routes.length > 0) {
                return data.routes[0].distance / 1000; // Convert to km
            }
        } catch (error) {
            console.warn('OSRM fallback failed:', error);
        }
        
        // Final fallback to Haversine
        return start.distanceTo(goal);
    }

    /**
     * Get cache key for two points
     * @param {Point} point1 - First point
     * @param {Point} point2 - Second point
     * @returns {string} Cache key
     */
    getCacheKey(point1, point2) {
        const coords1 = `${point1.latitude.toFixed(6)},${point1.longitude.toFixed(6)}`;
        const coords2 = `${point2.latitude.toFixed(6)},${point2.longitude.toFixed(6)}`;
        
        return coords1 < coords2 ? `${coords1}|${coords2}` : `${coords2}|${coords1}`;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxDistance: this.maxDistance,
            gridSize: this.gridSize
        };
    }
}
