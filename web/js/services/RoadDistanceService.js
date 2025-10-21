/**
 * Road Distance Service
 * Calculates road-based distances using OSRM routing service
 */

class RoadDistanceService {
    constructor() {
        this.baseUrl = 'https://router.project-osrm.org/route/v1/driving';
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes cache
        this.batchSize = 25; // OSRM batch limit
        this.progressBar = null;
        this.aStarAlgorithm = null;
        this.useAStar = true; // Enable A* optimization
    }

    /**
     * Calculate road distance between two points
     * @param {Point} point1 - First point
     * @param {Point} point2 - Second point
     * @returns {Promise<number>} Road distance in kilometers
     */
    async calculateRoadDistance(point1, point2) {
        console.log('🔍 calculateRoadDistance called for:', point1.latitude, point1.longitude, 'to', point2.latitude, point2.longitude);
        
        const cacheKey = this.getCacheKey(point1, point2);
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('📦 Using cached result');
            return {
                distance: cached.distance,
                geometry: cached.geometry,
                duration: 0,
                waypoints: null
            };
        }
        
        try {
            let result;
            
            console.log('🌐 Calling OSRM API...');
            // For now, always use OSRM to avoid A* issues
            // TODO: Fix A* algorithm and re-enable
            result = await this.calculateOSRMDistance(point1, point2);
            console.log('✅ OSRM result:', result);
            
            // Cache the result
            this.cache.set(cacheKey, {
                distance: result.distance,
                geometry: result.geometry,
                timestamp: Date.now()
            });
            
            return result;
        } catch (error) {
            console.warn('Road distance calculation failed, using Haversine:', error);
            // Fallback to Haversine distance
            return {
                distance: point1.distanceTo(point2),
                geometry: null,
                duration: 0,
                waypoints: null
            };
        }
    }

    /**
     * Calculate distance using OSRM API with road geometry
     * @param {Point} point1 - First point
     * @param {Point} point2 - Second point
     * @returns {Promise<Object>} Object with distance and geometry
     */
    async calculateOSRMDistance(point1, point2) {
        try {
            // Request full geometry for the route
            const url = `${this.baseUrl}/${point1.longitude},${point1.latitude};${point2.longitude},${point2.latitude}?overview=full&geometries=polyline`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                timeout: 15000 // 15 second timeout for geometry
            });
            
            if (!response.ok) {
                throw new Error(`OSRM API error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const distance = route.distance / 1000; // Convert meters to km
                
                console.log(`OSRM distance: ${distance.toFixed(2)} km`);
                console.log(`OSRM geometry: ${route.geometry ? route.geometry.substring(0, 50) + '...' : 'null'}`);
                console.log(`OSRM duration: ${route.duration / 60} minutes`);
                
                return {
                    distance: distance,
                    geometry: route.geometry,
                    duration: route.duration / 60, // Convert to minutes
                    waypoints: data.waypoints
                };
            } else {
                console.warn('No route found by OSRM, using Haversine');
                return {
                    distance: point1.distanceTo(point2),
                    geometry: null,
                    duration: 0,
                    waypoints: null
                };
            }
        } catch (error) {
            console.error('OSRM calculation failed:', error);
            return {
                distance: point1.distanceTo(point2),
                geometry: null,
                duration: 0,
                waypoints: null
            };
        }
    }

    /**
     * Calculate road distance matrix for multiple points
     * @param {Point[]} people - Array of people points
     * @param {Point[]} testCenters - Array of test center points
     * @returns {Promise<Array>} Distance matrix [personIndex][centerIndex]
     */
    async calculateRoadDistanceMatrix(people, testCenters) {
        const matrix = [];
        const totalCalculations = people.length * testCenters.length;
        
        console.log(`Calculating road distances for ${totalCalculations} pairs...`);
        
        // Process in batches to avoid overwhelming the API
        for (let i = 0; i < people.length; i++) {
            matrix[i] = [];
            
            for (let j = 0; j < testCenters.length; j++) {
                const distance = await this.calculateRoadDistance(people[i], testCenters[j]);
                matrix[i][j] = distance;
                
                // Add small delay to be respectful to the API
                if ((i * testCenters.length + j) % 10 === 0) {
                    await this.delay(100); // 100ms delay every 10 requests
                }
            }
            
            // Progress update
            const progress = Math.round(((i + 1) / people.length) * 100);
            console.log(`Road distance calculation progress: ${progress}%`);
        }
        
        console.log('Road distance matrix calculation completed!');
        return matrix;
    }

    /**
     * Calculate road distance matrix with batch optimization and progress bar
     * @param {Point[]} people - Array of people points
     * @param {Point[]} testCenters - Array of test center points
     * @param {ProgressBar} progressBar - Progress bar instance
     * @returns {Promise<Array>} Distance matrix [personIndex][centerIndex]
     */
    async calculateRoadDistanceMatrixBatch(people, testCenters, progressBar = null) {
        const matrix = [];
        const totalPairs = people.length * testCenters.length;
        
        console.log('🚗 RoadDistanceService: Starting batch calculation');
        console.log(`- Calculating road distances for ${totalPairs} pairs using optimized batch processing...`);
        console.log('- People count:', people.length);
        console.log('- Test centers count:', testCenters.length);
        console.log('- Progress bar available:', !!progressBar);
        
        // Initialize progress bar
        if (progressBar) {
            progressBar.show('Calculating Road Distances', totalPairs);
            this.progressBar = progressBar;
        }
        
        // Create all coordinate pairs
        const coordinatePairs = [];
        for (let i = 0; i < people.length; i++) {
            matrix[i] = [];
            for (let j = 0; j < testCenters.length; j++) {
                coordinatePairs.push({
                    personIndex: i,
                    centerIndex: j,
                    person: people[i],
                    center: testCenters[j]
                });
            }
        }
        
        // Generate colors for test centers
        const testCenterColors = this.generateTestCenterColors(testCenters.length);
        
        // Process in batches with progress updates
        const batches = this.chunkArray(coordinatePairs, this.batchSize);
        let processedCount = 0;
        
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            const batchResults = await this.processBatchWithProgress(batch, processedCount, totalPairs, testCenterColors);
            
            // Store results in matrix
            batchResults.forEach(result => {
                matrix[result.personIndex][result.centerIndex] = result.distance;
            });
            
            processedCount += batch.length;
            
            // Update progress
            if (this.progressBar) {
                const progress = Math.round((processedCount / totalPairs) * 100);
                const message = `Processed ${processedCount}/${totalPairs} distances (${progress}%)`;
                this.progressBar.updateProgress(processedCount, message);
                this.progressBar.updateDetails(`Batch ${batchIndex + 1}/${batches.length} completed`);
            }
            
            // Delay between batches
            if (batchIndex < batches.length - 1) {
                await this.delay(100); // Reduced delay for better performance
            }
        }
        
        console.log('Road distance matrix calculation completed!');
        
        // Complete progress bar
        if (this.progressBar) {
            this.progressBar.complete('All road distances calculated successfully!');
        }
        
        return matrix;
    }

    /**
     * Process a batch of coordinate pairs with progress updates
     * @param {Array} batch - Array of coordinate pairs
     * @param {number} processedCount - Number of already processed pairs
     * @param {number} totalPairs - Total number of pairs
     * @param {Object} testCenterColors - Map of centerIndex to color
     * @returns {Promise<Array>} Array of distance results
     */
    async processBatchWithProgress(batch, processedCount, totalPairs, testCenterColors = {}) {
        const results = [];
        
        for (let i = 0; i < batch.length; i++) {
            const pair = batch[i];
            
            // Highlight the path being calculated
            if (this.progressBar) {
                this.progressBar.highlightPath(pair.person, pair.center);
            }
            
            try {
                const routeData = await this.calculateRoadDistance(pair.person, pair.center);
                results.push({
                    personIndex: pair.personIndex,
                    centerIndex: pair.centerIndex,
                    distance: routeData.distance,
                    geometry: routeData.geometry,
                    duration: routeData.duration
                });
                
                console.log(`Calculated distance: Person ${pair.personIndex} -> Center ${pair.centerIndex}: ${routeData.distance.toFixed(2)} km`);
                
                // Display road route immediately
                if (this.progressBar) {
                    console.log('🎯 Calling displayRoadRoute with geometry:', routeData.geometry ? 'YES' : 'NO');
                    const color = testCenterColors[pair.centerIndex] || '#4CAF50';
                    this.progressBar.displayRoadRoute(pair.person, pair.center, routeData, color);
                }
                
            } catch (error) {
                console.error(`Error calculating distance for pair ${processedCount + i + 1}:`, error);
                // Use Haversine as fallback
                const fallbackDistance = pair.person.distanceTo(pair.center);
                results.push({
                    personIndex: pair.personIndex,
                    centerIndex: pair.centerIndex,
                    distance: fallbackDistance,
                    geometry: null,
                    duration: 0
                });
                
                // Mark path as calculated even with fallback
                if (this.progressBar) {
                    this.progressBar.markPathCalculated(pair.person, pair.center);
                }
            }
            
            // Update progress for individual calculations
            if (this.progressBar) {
                const currentProgress = processedCount + i + 1;
                const progress = Math.round((currentProgress / totalPairs) * 100);
                this.progressBar.updateProgress(currentProgress, totalPairs, `Calculating road distances... ${progress}%`);
            }
            
            // Small delay to allow visualization and prevent API overwhelming
            await this.delay(300);
        }
        
        return results;
    }

    /**
     * Process a batch of coordinate pairs
     * @param {Array} batch - Array of coordinate pairs
     * @returns {Promise<Array>} Array of distance results
     */
    async processBatch(batch) {
        const results = [];
        
        for (const pair of batch) {
            const distance = await this.calculateRoadDistance(pair.person, pair.center);
            results.push({
                personIndex: pair.personIndex,
                centerIndex: pair.centerIndex,
                distance: distance
            });
        }
        
        return results;
    }

    /**
     * Get cache key for two points
     * @param {Point} point1 - First point
     * @param {Point} point2 - Second point
     * @returns {string} Cache key
     */
    getCacheKey(point1, point2) {
        // Create consistent key regardless of order
        const coords1 = `${point1.latitude.toFixed(6)},${point1.longitude.toFixed(6)}`;
        const coords2 = `${point2.latitude.toFixed(6)},${point2.longitude.toFixed(6)}`;
        
        return coords1 < coords2 ? `${coords1}|${coords2}` : `${coords2}|${coords1}`;
    }

    /**
     * Split array into chunks
     * @param {Array} array - Array to chunk
     * @param {number} size - Chunk size
     * @returns {Array} Array of chunks
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Delay execution
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
            timeout: this.cacheTimeout,
            batchSize: this.batchSize
        };
    }

    /**
     * Calculate distance using fallback method (Haversine)
     * @param {Point} point1 - First point
     * @param {Point} point2 - Second point
     * @returns {number} Haversine distance in kilometers
     */
    calculateHaversineDistance(point1, point2) {
        return point1.distanceTo(point2);
    }

    /**
     * Generate colors for test centers
     * @param {number} numCenters - Number of test centers
     * @returns {Object} Map of centerIndex to color
     */
    generateTestCenterColors(numCenters) {
        // Color palette for test centers
        const colorPalette = [
            '#e74c3c', // Red
            '#3498db', // Blue
            '#2ecc71', // Green
            '#f39c12', // Orange
            '#9b59b6', // Purple
            '#1abc9c', // Turquoise
            '#e67e22', // Carrot
            '#34495e', // Wet Asphalt
            '#f1c40f', // Sun Flower
            '#e91e63'  // Pink
        ];
        
        const colors = {};
        for (let i = 0; i < numCenters; i++) {
            colors[i] = colorPalette[i % colorPalette.length];
        }
        
        return colors;
    }
}
