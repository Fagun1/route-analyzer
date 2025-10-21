/**
 * Progress Bar Component
 * Shows loading progress for long-running operations
 * Non-blocking design with close button and path highlighting
 */

class ProgressBar {
    constructor(containerId = 'progress-container') {
        this.containerId = containerId;
        this.progressBar = null;
        this.progressText = null;
        this.progressDetails = null;
        this.isVisible = false;
        this.currentPath = null; // For path highlighting
        this.total = 100;
        this.roadRoutesLayer = L.layerGroup(); // Layer for displaying actual road routes
        
        // Add road routes layer to map if available
        if (window.app && window.app.map) {
            this.roadRoutesLayer.addTo(window.app.map);
        }
    }

    /**
     * Show progress bar
     * @param {string} title - Progress title
     * @param {number} total - Total items to process
     */
    show(title = 'Processing...', total = 100) {
        this.total = total;
        this.createProgressBar(title, total);
        this.isVisible = true;
        
        // Ensure road routes layer is added to map
        if (window.app && window.app.map && !window.app.map.hasLayer(this.roadRoutesLayer)) {
            this.roadRoutesLayer.addTo(window.app.map);
        }
    }

    /**
     * Update progress
     * @param {number} current - Current progress
     * @param {number} total - Total items
     * @param {string} details - Additional details
     */
    updateProgress(current, total, details = '') {
        if (!this.isVisible) return;

        const percentage = Math.round((current / total) * 100);
        
        if (this.progressBar) {
            this.progressBar.style.width = `${percentage}%`;
        }
        
        if (this.progressText) {
            this.progressText.textContent = `${current}/${total} (${percentage}%)`;
        }
        
        if (this.progressDetails && details) {
            this.progressDetails.textContent = details;
        }
    }

    /**
     * Update details without changing progress
     * @param {string} details - Details to show
     */
    updateDetails(details) {
        if (this.progressDetails && this.isVisible) {
            this.progressDetails.textContent = details;
        }
    }

    /**
     * Highlight a path being calculated
     * @param {Object} person - Person point
     * @param {Object} center - Test center point
     */
    highlightPath(person, center) {
        // Remove previous highlight
        this.clearPathHighlight();
        
        // Create temporary line for highlighting
        if (window.app && window.app.map) {
            this.currentPath = L.polyline([
                [person.latitude, person.longitude],
                [center.latitude, center.longitude]
            ], {
                color: '#ff6b6b',
                weight: 3,
                opacity: 0.8,
                className: 'path-highlight'
            }).addTo(window.app.map);
        }
    }

    /**
     * Display actual road route immediately
     * @param {Object} person - Person point
     * @param {Object} center - Test center point
     * @param {Object} routeData - Route data with geometry
     * @param {string} color - Color for the route line (optional)
     */
    displayRoadRoute(person, center, routeData, color = '#4CAF50') {
        console.log('🎯 displayRoadRoute called with:');
        console.log('- Person:', person.latitude, person.longitude);
        console.log('- Center:', center.latitude, center.longitude);
        console.log('- Route data:', routeData);
        console.log('- Geometry available:', !!routeData.geometry);
        console.log('- Map available:', !!(window.app && window.app.map));
        
        // Remove previous highlight
        this.clearPathHighlight();
        
        if (window.app && window.app.map && routeData.geometry) {
            try {
                console.log('Decoding polyline:', routeData.geometry.substring(0, 50) + '...');
                
                // Try to decode polyline geometry
                let coordinates;
                try {
                    // First try our custom decoder
                    coordinates = this.decodePolyline(routeData.geometry);
                } catch (decodeError) {
                    console.warn('Custom decoder failed, trying alternative method:', decodeError);
                    // Alternative: create a simple route using waypoints
                    if (routeData.waypoints && routeData.waypoints.length >= 2) {
                        coordinates = [
                            [routeData.waypoints[0].location[1], routeData.waypoints[0].location[0]],
                            [routeData.waypoints[1].location[1], routeData.waypoints[1].location[0]]
                        ];
                        console.log('Using waypoints as fallback route');
                    } else {
                        throw new Error('No valid geometry or waypoints available');
                    }
                }
                
                console.log('Decoded coordinates:', coordinates.length, 'points');
                console.log('First coordinate:', coordinates[0]);
                console.log('Last coordinate:', coordinates[coordinates.length - 1]);
                
                // Validate coordinates
                if (coordinates.length < 2) {
                    throw new Error('Invalid polyline: not enough coordinates');
                }
                
                // Check if coordinates are valid
                const validCoords = coordinates.filter(coord => 
                    coord[0] >= -90 && coord[0] <= 90 && 
                    coord[1] >= -180 && coord[1] <= 180
                );
                
                if (validCoords.length < 2) {
                    throw new Error('Invalid coordinates in polyline');
                }
                
                // Create road route polyline
                const roadRoute = L.polyline(validCoords, {
                    color: color,
                    weight: 3,
                    opacity: 0.8,
                    className: 'road-route'
                }).addTo(this.roadRoutesLayer); // Add to dedicated layer
                
                // Add popup with route info
                roadRoute.bindPopup(`
                    <strong>Road Route</strong><br>
                    Distance: ${routeData.distance.toFixed(2)} km<br>
                    Duration: ${routeData.duration.toFixed(1)} min<br>
                    Person: ${person.category}<br>
                    Center: Test Center<br>
                    Points: ${validCoords.length}
                `);
                
                console.log(`✅ Displayed road route: ${routeData.distance.toFixed(2)} km with ${validCoords.length} points`);
                
            } catch (error) {
                console.error('❌ Error displaying road route:', error);
                console.log('Skipping visualization due to error');
                // Don't show straight lines - only show actual road routes
            }
        } else {
            console.log('❌ No geometry available, skipping visualization');
            console.log('- window.app:', !!window.app);
            console.log('- window.app.map:', !!(window.app && window.app.map));
            console.log('- routeData.geometry:', routeData.geometry);
            // Don't show straight lines - only show actual road routes
        }
    }

    /**
     * Decode polyline geometry from OSRM using Google's algorithm
     * @param {string} polyline - Encoded polyline string
     * @returns {Array} Array of [lat, lng] coordinates
     */
    decodePolyline(polyline) {
        const coordinates = [];
        let index = 0;
        let lat = 0;
        let lng = 0;
        
        while (index < polyline.length) {
            // Decode latitude
            let b, shift = 0, result = 0;
            do {
                b = polyline.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            
            const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += dlat;
            
            // Decode longitude
            shift = 0;
            result = 0;
            do {
                b = polyline.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            
            const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += dlng;
            
            coordinates.push([lat / 1e5, lng / 1e5]);
        }
        
        return coordinates;
    }

    /**
     * Test polyline decoder with a known polyline
     */
    testPolylineDecoder() {
        // Test with a simple polyline: "u{~|FnyynAp@"
        const testPolyline = "u{~|FnyynAp@";
        console.log('Testing polyline decoder with:', testPolyline);
        
        try {
            const coords = this.decodePolyline(testPolyline);
            console.log('Test coordinates:', coords);
            return coords.length > 0;
        } catch (error) {
            console.error('Polyline decoder test failed:', error);
            return false;
        }
    }

    /**
     * Clear path highlight
     */
    clearPathHighlight() {
        if (this.currentPath && window.app && window.app.map) {
            window.app.map.removeLayer(this.currentPath);
            this.currentPath = null;
        }
    }


    /**
     * Complete progress
     * @param {string} message - Completion message
     */
    complete(message = 'Completed successfully!') {
        if (!this.isVisible) return;

        this.updateDetails(message);
        
        // Auto-hide after 2 seconds
        setTimeout(() => {
            this.hide();
        }, 2000);
    }

    /**
     * Show error
     * @param {string} message - Error message
     */
    error(message = 'An error occurred') {
        if (!this.isVisible) return;

        this.updateDetails(`Error: ${message}`);
        
        // Change color to red
        if (this.progressBar) {
            this.progressBar.style.background = 'linear-gradient(90deg, #dc3545, #c82333)';
        }
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.hide();
        }, 3000);
    }

    /**
     * Hide progress bar
     */
    hide() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.style.display = 'none';
        }
        this.isVisible = false;
        this.clearPathHighlight();
    }

    /**
     * Create progress bar HTML
     * @param {string} title - Progress title
     * @param {number} total - Total items
     */
    createProgressBar(title, total) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Create progress bar HTML if it doesn't exist
        if (!container.querySelector('#progress-bar-fill')) {
            container.innerHTML = `
                <div id="progress-bar-container">
                    <button id="progress-close" onclick="window.hideProgressBar()">×</button>
                    <div id="progress-bar-fill"></div>
                    <div id="progress-text">${title}</div>
                    <div id="progress-details">Starting...</div>
                </div>
            `;
        }

        this.progressBar = container.querySelector('#progress-bar-fill');
        this.progressText = container.querySelector('#progress-text');
        this.progressDetails = container.querySelector('#progress-details');
        
        // Reset progress bar
        if (this.progressBar) {
            this.progressBar.style.width = '0%';
            this.progressBar.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
        }
        
        if (this.progressText) {
            this.progressText.textContent = title;
        }
        
        if (this.progressDetails) {
            this.progressDetails.textContent = 'Starting...';
        }

        container.style.display = 'block';
        
        // Make hideProgressBar globally available
        window.hideProgressBar = () => this.hide();
    }
}