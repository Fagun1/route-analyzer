/**
 * Random Point Generation Algorithm
 * Generates random points within circular radius using rejection sampling
 */

class RandomPointGenerator {
    constructor() {
        this.generationStats = {
            totalAttempts: 0,
            successfulPoints: 0,
            generationTimeMs: 0,
            averageDistance: 0,
            minDistance: Infinity,
            maxDistance: 0
        };
    }

    /**
     * Generate random points within circular radius
     * @param {number} centerLat - Center latitude
     * @param {number} centerLng - Center longitude
     * @param {number} radiusKm - Radius in kilometers
     * @param {number} numPoints - Number of points to generate
     * @param {string} pointType - Type of points ('people' or 'test_centers')
     * @returns {Point[]} Array of generated points
     */
    generatePointsInRadius(centerLat, centerLng, radiusKm, numPoints, pointType = 'people') {
        const startTime = performance.now();
        const points = [];
        const centerPoint = new Point(centerLat, centerLng);
        
        let attempts = 0;
        let successfulPoints = 0;
        
        while (successfulPoints < numPoints && attempts < numPoints * 10) {
            attempts++;
            
            const point = this.generateSinglePoint(centerLat, centerLng, radiusKm);
            
            if (this.isValidPoint(point.latitude, point.longitude)) {
                // Assign type and category based on pointType
                if (pointType === 'people') {
                    point.type = 'person';
                    point.category = this.getRandomPersonCategory();
                } else if (pointType === 'test_centers') {
                    point.type = 'test_center';
                    point.category = 'center';
                }
                
                points.push(point);
                successfulPoints++;
            }
        }
        
        const endTime = performance.now();
        this.updateStats(points, attempts, successfulPoints, endTime - startTime, centerPoint);
        
        return points;
    }

    /**
     * Generate a single random point within radius using rejection sampling
     * @param {number} centerLat - Center latitude
     * @param {number} centerLng - Center longitude
     * @param {number} radiusKm - Radius in kilometers
     * @returns {Point} Generated point
     */
    generateSinglePoint(centerLat, centerLng, radiusKm) {
        const radiusDegrees = radiusKm / 111; // Convert km to degrees
        let lat, lng, distance;
        
        do {
            // Generate random angle and distance
            const angle = Math.random() * 2 * Math.PI;
            const distanceKm = Math.sqrt(Math.random()) * radiusKm; // Square root for uniform area distribution
            
            // Convert to coordinates
            lat = centerLat + (distanceKm / 111) * Math.cos(angle);
            lng = centerLng + (distanceKm / 111) * Math.sin(angle);
            
            // Calculate distance from center
            distance = this.calculateDistance(centerLat, centerLng, lat, lng);
            
        } while (distance > radiusKm);
        
        return new Point(lat, lng, 'person', 'male'); // Default values
    }

    /**
     * Calculate distance between two points using Haversine formula
     * @param {number} lat1 - First latitude
     * @param {number} lng1 - First longitude
     * @param {number} lat2 - Second latitude
     * @param {number} lng2 - Second longitude
     * @returns {number} Distance in kilometers
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    /**
     * Get random person category (male, female, pwd)
     * @returns {string} Random person category
     */
    getRandomPersonCategory() {
        const categories = ['male', 'female', 'pwd'];
        const weights = [0.45, 0.45, 0.10]; // 45% male, 45% female, 10% PWD
        
        const random = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < categories.length; i++) {
            cumulative += weights[i];
            if (random <= cumulative) {
                return categories[i];
            }
        }
        
        return 'male'; // Default fallback
    }

    /**
     * Validate if a point is suitable for generation
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {boolean} True if valid
     */
    isValidPoint(lat, lng) {
        // Check geographic bounds
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return false;
        }
        
        // Avoid extreme polar regions
        if (Math.abs(lat) > 85) {
            return false;
        }
        
        // Accept most points for DSA demonstration
        return Math.random() < 0.98;
    }

    /**
     * Generate test centers with specific distribution
     * @param {number} centerLat - Center latitude
     * @param {number} centerLng - Center longitude
     * @param {number} radiusKm - Radius in kilometers
     * @param {number} numCenters - Number of test centers to generate
     * @returns {Point[]} Array of generated test centers
     */
    generateTestCenters(centerLat, centerLng, radiusKm, numCenters) {
        return this.generatePointsInRadius(centerLat, centerLng, radiusKm, numCenters, 'test_centers');
    }

    /**
     * Generate points with custom validation function
     * @param {number} centerLat - Center latitude
     * @param {number} centerLng - Center longitude
     * @param {number} radiusKm - Radius in kilometers
     * @param {number} numPoints - Number of points
     * @param {Function} validator - Custom validation function
     * @returns {Point[]} Array of generated points
     */
    generatePointsWithValidation(centerLat, centerLng, radiusKm, numPoints, validator) {
        const startTime = performance.now();
        const points = [];
        
        let attempts = 0;
        let successfulPoints = 0;
        
        while (successfulPoints < numPoints && attempts < numPoints * 10) {
            attempts++;
            
            const point = this.generateSinglePoint(centerLat, centerLng, radiusKm);
            
            if (validator(point.latitude, point.longitude)) {
                points.push(point);
                successfulPoints++;
            }
        }
        
        const endTime = performance.now();
        this.generationStats.generationTimeMs = endTime - startTime;
        this.generationStats.totalAttempts = attempts;
        this.generationStats.successfulPoints = successfulPoints;
        
        return points;
    }

    /**
     * Performance test for large number of points
     * @param {number} centerLat - Center latitude
     * @param {number} centerLng - Center longitude
     * @param {number} radiusKm - Radius in kilometers
     * @param {number} numPoints - Number of points
     * @returns {Point[]} Array of generated points
     */
    generatePointsPerformanceTest(centerLat, centerLng, radiusKm, numPoints) {
        console.log(`Starting performance test for ${numPoints} points...`);
        
        const points = this.generatePointsInRadius(centerLat, centerLng, radiusKm, numPoints);
        
        console.log('Performance Test Results:');
        console.log(`Generated: ${points.length} points`);
        console.log(`Time: ${this.generationStats.generationTimeMs.toFixed(3)} ms`);
        console.log(`Rate: ${Math.round(points.length * 1000 / this.generationStats.generationTimeMs)} points/second`);
        
        return points;
    }

    /**
     * Update generation statistics
     * @param {Point[]} points - Generated points
     * @param {number} attempts - Total attempts
     * @param {number} successful - Successful points
     * @param {number} timeMs - Generation time
     * @param {Point} centerPoint - Center point for distance calculations
     */
    updateStats(points, attempts, successful, timeMs, centerPoint) {
        this.generationStats.totalAttempts = attempts;
        this.generationStats.successfulPoints = successful;
        this.generationStats.generationTimeMs = timeMs;
        
        if (points.length > 0) {
            const distances = points.map(point => point.distanceTo(centerPoint));
            this.generationStats.averageDistance = distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
            this.generationStats.minDistance = Math.min(...distances);
            this.generationStats.maxDistance = Math.max(...distances);
        }
    }

    /**
     * Get last generation statistics
     * @returns {Object} Generation statistics
     */
    getLastGenerationStats() {
        return { ...this.generationStats };
    }

    /**
     * Get algorithm complexity information
     * @returns {Object} Complexity information
     */
    getComplexityInfo() {
        return {
            timeComplexity: 'O(n)',
            spaceComplexity: 'O(n)',
            description: 'Rejection sampling with uniform distribution in circular area'
        };
    }
}
