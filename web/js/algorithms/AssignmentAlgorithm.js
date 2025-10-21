/**
 * Assignment Algorithm for People to Test Centers
 * Uses priority-based greedy assignment with distance optimization
 */

class AssignmentAlgorithm {
    constructor() {
        this.assignments = new Map(); // personId -> testCenterId
        this.testCenterCapacity = new Map(); // testCenterId -> remaining capacity
        this.assignmentStats = {
            totalAssigned: 0,
            pwdAssigned: 0,
            femaleAssigned: 0,
            maleAssigned: 0,
            averageDistance: 0,
            maxDistance: 0,
            minDistance: Infinity
        };
        this.roadDistanceService = null;
        this.useRoadDistances = true; // Flag to enable/disable road distances
        this.routeDataMap = {}; // Store route data for road routes
        this.testCenterColors = {}; // Store test center colors
    }

    /**
     * Assign people to test centers with priority
     * @param {Point[]} people - Array of people points
     * @param {Point[]} testCenters - Array of test center points
     * @param {number} capacityPerCenter - Maximum people per test center
     * @param {RoadDistanceService} roadDistanceService - Service for road distance calculation
     * @param {ProgressBar} progressBar - Progress bar for road distance calculation
     * @returns {Promise<Object>} Assignment results
     */
    async assignPeopleToTestCenters(people, testCenters, capacityPerCenter = 50, roadDistanceService = null, progressBar = null) {
        // Reset assignments
        this.assignments.clear();
        this.testCenterCapacity.clear();
        
        // Set road distance service
        this.roadDistanceService = roadDistanceService;
        
        // Initialize test center capacities
        testCenters.forEach((center, index) => {
            this.testCenterCapacity.set(index, capacityPerCenter);
        });

        // Calculate all distances (road-based or Haversine)
        const distanceMatrix = await this.calculateDistanceMatrix(people, testCenters, progressBar);
        
        // Sort people by priority (PWD > Female > Male)
        const sortedPeople = this.sortPeopleByPriority(people);
        
        // Assign people using priority-based greedy algorithm
        const assignmentResults = this.performPriorityAssignment(sortedPeople, testCenters, distanceMatrix);
        
        // Calculate statistics
        this.calculateAssignmentStats(assignmentResults, distanceMatrix);
        
        return {
            assignments: this.assignments,
            stats: this.assignmentStats,
            assignmentResults: assignmentResults,
            distanceType: this.useRoadDistances ? 'road' : 'straight-line'
        };
    }

    /**
     * Calculate distance matrix between all people and test centers
     * @param {Point[]} people - Array of people
     * @param {Point[]} testCenters - Array of test centers
     * @param {ProgressBar} progressBar - Progress bar for road distance calculation
     * @returns {Promise<Array>} Distance matrix [personIndex][centerIndex]
     */
    async calculateDistanceMatrix(people, testCenters, progressBar = null) {
        console.log('🔍 Distance Matrix Calculation:');
        console.log('- Use road distances:', this.useRoadDistances);
        console.log('- Road distance service available:', !!this.roadDistanceService);
        console.log('- Progress bar available:', !!progressBar);
        
        if (this.useRoadDistances && this.roadDistanceService) {
            console.log('🚗 Calculating road-based distance matrix...');
            const result = await this.roadDistanceService.calculateRoadDistanceMatrixBatch(people, testCenters, progressBar);
            // Store route data for later use
            this.routeDataMap = result.routeDataMap;
            this.testCenterColors = result.testCenterColors;
            console.log('🎨 Stored test center colors:', this.testCenterColors);
            return result.matrix;
        } else {
            console.log('📏 Calculating straight-line distance matrix...');
            return this.calculateHaversineDistanceMatrix(people, testCenters);
        }
    }

    /**
     * Calculate Haversine distance matrix (fallback)
     * @param {Point[]} people - Array of people
     * @param {Point[]} testCenters - Array of test centers
     * @returns {Array} Distance matrix [personIndex][centerIndex]
     */
    calculateHaversineDistanceMatrix(people, testCenters) {
        const matrix = [];
        
        for (let i = 0; i < people.length; i++) {
            matrix[i] = [];
            for (let j = 0; j < testCenters.length; j++) {
                const distance = people[i].distanceTo(testCenters[j]);
                matrix[i][j] = distance;
            }
        }
        
        return matrix;
    }

    /**
     * Sort people by priority (PWD > Female > Male)
     * @param {Point[]} people - Array of people
     * @returns {Point[]} Sorted people array
     */
    sortPeopleByPriority(people) {
        const priorityOrder = { 'pwd': 1, 'female': 2, 'male': 3 };
        
        return people.slice().sort((a, b) => {
            return priorityOrder[a.category] - priorityOrder[b.category];
        });
    }

    /**
     * Perform priority-based assignment
     * @param {Point[]} sortedPeople - People sorted by priority
     * @param {Point[]} testCenters - Test centers
     * @param {Array} distanceMatrix - Pre-calculated distance matrix
     * @returns {Array} Assignment results
     */
    performPriorityAssignment(sortedPeople, testCenters, distanceMatrix) {
        const results = [];
        const originalIndices = new Map();
        
        // Map sorted people back to original indices
        sortedPeople.forEach((person, sortedIndex) => {
            const originalIndex = sortedPeople.indexOf(person);
            originalIndices.set(sortedIndex, originalIndex);
        });

        for (let i = 0; i < sortedPeople.length; i++) {
            const person = sortedPeople[i];
            const originalPersonIndex = originalIndices.get(i);
            
            // Find best available test center for this person
            const bestAssignment = this.findBestAvailableCenter(
                originalPersonIndex, testCenters, distanceMatrix
            );
            
            if (bestAssignment) {
                const { centerIndex, distance } = bestAssignment;
                
                // Make assignment
                this.assignments.set(originalPersonIndex, centerIndex);
                this.testCenterCapacity.set(centerIndex, this.testCenterCapacity.get(centerIndex) - 1);
                
                // Display road route for this assignment if available
                this.displayRoadRouteForAssignment(person, testCenters[centerIndex], originalPersonIndex, centerIndex);
                
                results.push({
                    personIndex: originalPersonIndex,
                    centerIndex: centerIndex,
                    person: person,
                    center: testCenters[centerIndex],
                    distance: distance,
                    category: person.category
                });
            }
        }
        
        return results;
    }

    /**
     * Find best available test center for a person
     * @param {number} personIndex - Person index
     * @param {Point[]} testCenters - Test centers
     * @param {Array} distanceMatrix - Distance matrix
     * @returns {Object|null} Best assignment or null if none available
     */
    findBestAvailableCenter(personIndex, testCenters, distanceMatrix) {
        let bestCenter = null;
        let bestDistance = Infinity;
        
        for (let centerIndex = 0; centerIndex < testCenters.length; centerIndex++) {
            // Check if center has capacity
            if (this.testCenterCapacity.get(centerIndex) > 0) {
                const distance = distanceMatrix[personIndex][centerIndex];
                
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestCenter = centerIndex;
                }
            }
        }
        
        return bestCenter !== null ? { centerIndex: bestCenter, distance: bestDistance } : null;
    }

    /**
     * Calculate assignment statistics
     * @param {Array} assignmentResults - Assignment results
     * @param {Array} distanceMatrix - Distance matrix
     */
    calculateAssignmentStats(assignmentResults, distanceMatrix) {
        this.assignmentStats.totalAssigned = assignmentResults.length;
        this.assignmentStats.pwdAssigned = 0;
        this.assignmentStats.femaleAssigned = 0;
        this.assignmentStats.maleAssigned = 0;
        
        let totalDistance = 0;
        let distances = [];
        
        assignmentResults.forEach(result => {
            // Count by category
            switch (result.category) {
                case 'pwd':
                    this.assignmentStats.pwdAssigned++;
                    break;
                case 'female':
                    this.assignmentStats.femaleAssigned++;
                    break;
                case 'male':
                    this.assignmentStats.maleAssigned++;
                    break;
            }
            
            totalDistance += result.distance;
            distances.push(result.distance);
        });
        
        // Calculate distance statistics
        if (distances.length > 0) {
            this.assignmentStats.averageDistance = totalDistance / distances.length;
            this.assignmentStats.maxDistance = Math.max(...distances);
            this.assignmentStats.minDistance = Math.min(...distances);
        }
    }

    /**
     * Get assignment statistics
     * @returns {Object} Assignment statistics
     */
    getAssignmentStats() {
        return { ...this.assignmentStats };
    }

    /**
     * Get assignments map
     * @returns {Map} Assignments map
     */
    getAssignments() {
        return new Map(this.assignments);
    }

    /**
     * Clear all assignments
     */
    clearAssignments() {
        this.assignments.clear();
        this.testCenterCapacity.clear();
        this.assignmentStats = {
            totalAssigned: 0,
            pwdAssigned: 0,
            femaleAssigned: 0,
            maleAssigned: 0,
            averageDistance: 0,
            maxDistance: 0,
            minDistance: Infinity
        };
    }

    /**
     * Enable or disable road distance calculation
     * @param {boolean} enabled - Whether to use road distances
     */
    setRoadDistanceEnabled(enabled) {
        this.useRoadDistances = enabled;
    }

    /**
     * Check if road distances are enabled
     * @returns {boolean} True if road distances are enabled
     */
    isRoadDistanceEnabled() {
        return this.useRoadDistances;
    }

    /**
     * Display road route for a specific assignment
     * @param {Point} person - Person point
     * @param {Point} center - Test center point
     * @param {number} personIndex - Person index
     * @param {number} centerIndex - Center index
     */
    displayRoadRouteForAssignment(person, center, personIndex, centerIndex) {
        console.log(`🎯 Attempting to display road route for assignment: Person ${personIndex} -> Center ${centerIndex}`);
        console.log(`🎯 Person coordinates: [${person.lat}, ${person.lng}]`);
        console.log(`🎯 Center coordinates: [${center.lat}, ${center.lng}]`);
        
        // Only display if we have route data and progress bar
        if (this.routeDataMap && this.testCenterColors && window.app && window.app.progressBar) {
            const routeKey = `${personIndex}-${centerIndex}`;
            const routeData = this.routeDataMap[routeKey];
            
            console.log(`🎯 Route key: ${routeKey}`);
            console.log(`🎯 Route data exists:`, !!routeData);
            console.log(`🎯 Route data geometry exists:`, !!(routeData && routeData.geometry));
            
            if (routeData && routeData.geometry) {
                const color = this.testCenterColors[centerIndex] || '#4CAF50';
                console.log(`🎯 Displaying road route for assignment: Person ${personIndex} -> Center ${centerIndex}`);
                console.log(`🎨 Using color: ${color} for center ${centerIndex}`);
                console.log(`🎨 Center index: ${centerIndex}, Color: ${color}`);
                console.log(`🎨 Available colors:`, this.testCenterColors);
                window.app.progressBar.displayRoadRoute(person, center, routeData, color);
            } else {
                console.log(`⚠️ No route data found for ${routeKey}`);
                console.log(`⚠️ Available route keys:`, Object.keys(this.routeDataMap || {}));
            }
        } else {
            console.log(`⚠️ Cannot display road route - missing dependencies`);
            console.log(`- routeDataMap exists:`, !!this.routeDataMap);
            console.log(`- testCenterColors exists:`, !!this.testCenterColors);
            console.log(`- window.app exists:`, !!window.app);
            console.log(`- progressBar exists:`, !!(window.app && window.app.progressBar));
        }
    }

    /**
     * Get algorithm complexity information
     * @returns {Object} Complexity information
     */
    getComplexityInfo() {
        return {
            timeComplexity: this.useRoadDistances ? 'O(P * C * R) + O(P log P)' : 'O(P * C + P log P)',
            spaceComplexity: 'O(P * C)',
            description: this.useRoadDistances ? 
                'Priority-based greedy assignment with road distance optimization' :
                'Priority-based greedy assignment with straight-line distance optimization'
        };
    }
}
