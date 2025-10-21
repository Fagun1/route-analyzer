/**
 * Assignment Visualizer
 * Creates visual representations of people-to-test-center assignments
 */

class AssignmentVisualizer {
    constructor(map, assignmentLayer) {
        this.map = map;
        this.assignmentLayer = assignmentLayer;
        this.assignmentLines = [];
        this.assignmentMarkers = [];
    }

    /**
     * Visualize assignments on map
     * @param {Array} assignmentResults - Assignment results
     * @param {Object} options - Visualization options
     */
    visualizeAssignments(assignmentResults, options = {}) {
        // Clear existing visualizations, but preserve road routes if using road distances
        const preserveRoadRoutes = options.showLines === false; // If showLines is false, we're using road routes
        this.clearVisualizations(!preserveRoadRoutes);
        
        const {
            showLines = true,
            showStats = true,
            lineOpacity = 0.6,
            lineWeight = 2,
            showPopups = true
        } = options;

        // Create assignment lines
        if (showLines) {
            this.createAssignmentLines(assignmentResults, { lineOpacity, lineWeight });
        }

        // Create assignment markers
        this.createAssignmentMarkers(assignmentResults, { showPopups });

        // Add assignment statistics
        if (showStats) {
            this.displayAssignmentStats(assignmentResults);
        }
    }

    /**
     * Create assignment lines between people and test centers
     * @param {Array} assignmentResults - Assignment results
     * @param {Object} options - Line options
     */
    createAssignmentLines(assignmentResults, options = {}) {
        const { lineOpacity = 0.6, lineWeight = 2 } = options;
        
        // Get unique test centers and assign colors
        const testCenterColors = this.generateTestCenterColors(assignmentResults);
        
        assignmentResults.forEach(result => {
            const { person, center, distance, category, centerIndex } = result;
            
            // Get color based on test center (not person category)
            const color = testCenterColors[centerIndex];
            
            // Create line from person to test center
            const line = L.polyline([
                [person.latitude, person.longitude],
                [center.latitude, center.longitude]
            ], {
                color: color,
                weight: lineWeight,
                opacity: lineOpacity,
                dashArray: this.getDashPattern(category)
            }).addTo(this.assignmentLayer);
            
            // Add popup with assignment info
            line.bindPopup(`
                <strong>Assignment Details</strong><br>
                <strong>Person:</strong> ${this.getCategoryName(category)}<br>
                <strong>Test Center:</strong> ${centerIndex + 1}<br>
                <strong>Distance:</strong> ${distance.toFixed(2)} km<br>
                <strong>Priority:</strong> ${this.getPriorityLevel(category)}
            `);
            
            this.assignmentLines.push(line);
        });
    }

    /**
     * Create assignment markers
     * @param {Array} assignmentResults - Assignment results
     * @param {Object} options - Marker options
     */
    createAssignmentMarkers(assignmentResults, options = {}) {
        const { showPopups = true } = options;
        
        // Get test center colors
        const testCenterColors = this.generateTestCenterColors(assignmentResults);
        
        // Group assignments by test center
        const centerAssignments = new Map();
        
        assignmentResults.forEach(result => {
            const centerId = result.centerIndex;
            if (!centerAssignments.has(centerId)) {
                centerAssignments.set(centerId, []);
            }
            centerAssignments.get(centerId).push(result);
        });
        
        // Create markers for each test center showing assignment count
        centerAssignments.forEach((assignments, centerId) => {
            const center = assignments[0].center;
            const totalAssigned = assignments.length;
            const centerColor = testCenterColors[centerId];
            
            // Count by category
            const pwdCount = assignments.filter(a => a.category === 'pwd').length;
            const femaleCount = assignments.filter(a => a.category === 'female').length;
            const maleCount = assignments.filter(a => a.category === 'male').length;
            
            // Create marker with assignment count and matching color
            const marker = L.circleMarker([center.latitude, center.longitude], {
                radius: Math.max(15, Math.min(30, 15 + totalAssigned * 0.5)),
                fillColor: centerColor,
                color: this.darkenColor(centerColor, 0.3),
                weight: 3,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.assignmentLayer);
            
            if (showPopups) {
                marker.bindPopup(`
                    <strong>Test Center ${centerId + 1}</strong><br>
                    <strong>Total Assigned:</strong> ${totalAssigned}<br>
                    <strong>PWD:</strong> ${pwdCount}<br>
                    <strong>Female:</strong> ${femaleCount}<br>
                    <strong>Male:</strong> ${maleCount}<br>
                    <div style="margin-top: 8px; padding: 4px; background: ${centerColor}; border-radius: 3px; width: 20px; height: 8px;"></div>
                `);
            }
            
            this.assignmentMarkers.push(marker);
        });
    }

    /**
     * Display assignment statistics
     * @param {Array} assignmentResults - Assignment results
     */
    displayAssignmentStats(assignmentResults) {
        const stats = this.calculateStats(assignmentResults);
        
        // Create stats panel
        const statsPanel = L.control({ position: 'topright' });
        
        statsPanel.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'assignment-stats-panel');
            div.innerHTML = `
                <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); min-width: 200px;">
                    <h4 style="margin: 0 0 10px 0; color: #2c3e50;">Assignment Statistics</h4>
                    <div style="font-size: 12px; line-height: 1.4;">
                        <div><strong>Total Assigned:</strong> ${stats.totalAssigned}</div>
                        <div style="color: #f39c12;"><strong>♿ PWD:</strong> ${stats.pwdAssigned}</div>
                        <div style="color: #e74c3c;"><strong>👩 Female:</strong> ${stats.femaleAssigned}</div>
                        <div style="color: #3498db;"><strong>👨 Male:</strong> ${stats.maleAssigned}</div>
                        <hr style="margin: 8px 0;">
                        <div><strong>Avg Distance:</strong> ${stats.averageDistance.toFixed(2)} km</div>
                        <div><strong>Max Distance:</strong> ${stats.maxDistance.toFixed(2)} km</div>
                        <div><strong>Min Distance:</strong> ${stats.minDistance.toFixed(2)} km</div>
                    </div>
                </div>
            `;
            return div;
        };
        
        statsPanel.addTo(this.map);
        this.statsPanel = statsPanel;
    }

    /**
     * Calculate assignment statistics
     * @param {Array} assignmentResults - Assignment results
     * @returns {Object} Statistics
     */
    calculateStats(assignmentResults) {
        const stats = {
            totalAssigned: assignmentResults.length,
            pwdAssigned: 0,
            femaleAssigned: 0,
            maleAssigned: 0,
            averageDistance: 0,
            maxDistance: 0,
            minDistance: Infinity
        };
        
        let totalDistance = 0;
        const distances = [];
        
        assignmentResults.forEach(result => {
            // Count by category
            switch (result.category) {
                case 'pwd':
                    stats.pwdAssigned++;
                    break;
                case 'female':
                    stats.femaleAssigned++;
                    break;
                case 'male':
                    stats.maleAssigned++;
                    break;
            }
            
            totalDistance += result.distance;
            distances.push(result.distance);
        });
        
        if (distances.length > 0) {
            stats.averageDistance = totalDistance / distances.length;
            stats.maxDistance = Math.max(...distances);
            stats.minDistance = Math.min(...distances);
        }
        
        return stats;
    }

    /**
     * Generate colors for test centers
     * @param {Array} assignmentResults - Assignment results
     * @returns {Object} Map of centerIndex to color
     */
    generateTestCenterColors(assignmentResults) {
        // Get unique test center indices
        const uniqueCenters = [...new Set(assignmentResults.map(result => result.centerIndex))];
        
        // Color palette for test centers
        const colorPalette = [
            '#e74c3c', // Red
            '#3498db', // Blue
            '#2ecc71', // Green
            '#f39c12', // Orange
            '#9b59b6', // Purple
            '#1abc9c', // Turquoise
            '#e67e22', // Carrot
            '#34495e', // Dark Blue
            '#f1c40f', // Yellow
            '#e91e63', // Pink
            '#00bcd4', // Cyan
            '#4caf50', // Light Green
            '#ff9800', // Deep Orange
            '#795548', // Brown
            '#607d8b'  // Blue Grey
        ];
        
        const centerColors = {};
        uniqueCenters.forEach((centerIndex, i) => {
            centerColors[centerIndex] = colorPalette[i % colorPalette.length];
        });
        
        return centerColors;
    }

    /**
     * Darken a color by a percentage
     * @param {string} color - Hex color code
     * @param {number} percent - Percentage to darken (0-1)
     * @returns {string} Darkened hex color
     */
    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent * 100);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    /**
     * Get color for person category
     * @param {string} category - Person category
     * @returns {string} Color code
     */
    getCategoryColor(category) {
        switch (category) {
            case 'male': return '#3498db';
            case 'female': return '#e74c3c';
            case 'pwd': return '#f39c12';
            default: return '#95a5a6';
        }
    }

    /**
     * Get dash pattern for line based on category
     * @param {string} category - Person category
     * @returns {string} Dash pattern
     */
    getDashPattern(category) {
        switch (category) {
            case 'pwd': return '10, 5'; // Dashed for PWD (highest priority)
            case 'female': return '5, 5'; // Dotted for female
            case 'male': return null; // Solid for male
            default: return null;
        }
    }

    /**
     * Get category name
     * @param {string} category - Person category
     * @returns {string} Category name
     */
    getCategoryName(category) {
        switch (category) {
            case 'male': return 'Male';
            case 'female': return 'Female';
            case 'pwd': return 'Person with Disability';
            default: return 'Unknown';
        }
    }

    /**
     * Get priority level
     * @param {string} category - Person category
     * @returns {string} Priority level
     */
    getPriorityLevel(category) {
        switch (category) {
            case 'pwd': return '1 (Highest)';
            case 'female': return '2 (Medium)';
            case 'male': return '3 (Lowest)';
            default: return 'Unknown';
        }
    }

    /**
     * Clear all visualizations
     * @param {boolean} clearRoadRoutes - Whether to clear road routes (default: true)
     */
    clearVisualizations(clearRoadRoutes = true) {
        // Clear assignment lines
        this.assignmentLines.forEach(line => {
            this.assignmentLayer.removeLayer(line);
        });
        this.assignmentLines = [];
        
        // Clear assignment markers
        this.assignmentMarkers.forEach(marker => {
            this.assignmentLayer.removeLayer(marker);
        });
        this.assignmentMarkers = [];
        
        // Clear road routes only if requested (not during road distance assignments)
        if (clearRoadRoutes && window.app && window.app.progressBar) {
            window.app.progressBar.clearRoadRoutes();
        }
        
        // Clear stats panel
        if (this.statsPanel) {
            this.map.removeControl(this.statsPanel);
            this.statsPanel = null;
        }
    }

    /**
     * Highlight specific assignment
     * @param {Object} assignment - Assignment to highlight
     */
    highlightAssignment(assignment) {
        // Implementation for highlighting specific assignments
        // Can be used for interactive features
    }
}
