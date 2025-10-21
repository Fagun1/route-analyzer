/**
 * Route Analyzer Main Application
 * Coordinates all components and handles user interactions
 */

class RouteAnalyzerApp {
    constructor() {
        this.map = null;
        this.startMarker = null;
        this.endMarker = null;
        this.userMarker = null;
        this.routeLayer = null;
        this.trafficLayer = null;
        this.randomPointsLayer = null;
        
        this.startLocation = null;
        this.endLocation = null;
        this.randomPoints = [];
        this.testCenters = [];
        
        this.trafficProcessor = new TrafficDataProcessor();
        this.randomPointGenerator = new RandomPointGenerator();
        this.graph = new Graph();
        this.dijkstra = null;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.initMap();
        this.setupEventListeners();
        this.createSampleGraph();
    }

    /**
     * Initialize the map
     */
    initMap() {
        const defaultLocation = [40.7128, -74.0060]; // NYC
        const defaultZoom = 13;
        
        this.map = L.map('map').setView(defaultLocation, defaultZoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
        
        this.routeLayer = L.layerGroup().addTo(this.map);
        this.randomPointsLayer = L.layerGroup().addTo(this.map);
        
        this.getUserLocation();
        
        this.map.on('click', (e) => {
            if (!this.startLocation) {
                this.setStartLocation(e.latlng.lat, e.latlng.lng);
            } else if (!this.endLocation) {
                this.setEndLocation(e.latlng.lat, e.latlng.lng);
            } else {
                this.setStartLocation(e.latlng.lat, e.latlng.lng);
            }
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Make functions globally available for onclick handlers
        window.findRoute = () => this.findRoute();
        window.getUserLocation = () => this.getUserLocation();
        window.clearRoute = () => this.clearRoute();
        window.generateRandomLocations = () => this.generateRandomLocations();
        window.clearRandomPoints = () => this.clearRandomPoints();
        window.generateTestCenters = () => this.generateTestCenters();
        window.clearTestCenters = () => this.clearTestCenters();
    }

    /**
     * Create sample graph for demonstration
     */
    createSampleGraph() {
        // Add vertices
        this.graph.addVertex('A');
        this.graph.addVertex('B');
        this.graph.addVertex('C');
        this.graph.addVertex('D');
        this.graph.addVertex('E');
        
        // Add edges
        this.graph.addEdge('A', 'B', 4);
        this.graph.addEdge('A', 'C', 2);
        this.graph.addEdge('B', 'C', 1);
        this.graph.addEdge('B', 'D', 5);
        this.graph.addEdge('C', 'D', 8);
        this.graph.addEdge('C', 'E', 10);
        this.graph.addEdge('D', 'E', 2);
        
        this.dijkstra = new DijkstraAlgorithm(this.graph);
        
        console.log('Sample graph created:');
        this.graph.displayGraph();
    }

    /**
     * Get user's current location
     */
    getUserLocation() {
        if (navigator.geolocation) {
            Utils.showToast('Requesting your location...', 'success');
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;
                    
                    this.map.setView([userLat, userLng], 15);
                    
                    if (this.userMarker) {
                        this.map.removeLayer(this.userMarker);
                    }
                    
                    this.userMarker = L.marker([userLat, userLng], {
                        icon: L.divIcon({
                            className: 'user-location-marker',
                            html: '📍',
                            iconSize: [25, 25]
                        })
                    }).addTo(this.map);
                    this.userMarker.bindPopup('Your Location').openPopup();
                    
                    Utils.showToast('Location found! Map centered on your position.', 'success');
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    let errorMessage = 'Unable to get your location. ';
                    
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage += 'Location access denied by user.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage += 'Location information unavailable.';
                            break;
                        case error.TIMEOUT:
                            errorMessage += 'Location request timed out.';
                            break;
                        default:
                            errorMessage += 'Unknown error occurred.';
                            break;
                    }
                    
                    Utils.showToast(errorMessage, 'warning');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        } else {
            Utils.showToast('Geolocation is not supported by this browser.', 'warning');
        }
    }

    /**
     * Set start location
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     */
    setStartLocation(lat, lng) {
        this.startLocation = { lat, lng };
        if (this.startMarker) this.map.removeLayer(this.startMarker);
        this.startMarker = L.marker([lat, lng], {color: 'green'}).addTo(this.map);
        this.startMarker.bindPopup('Start Location').openPopup();
    }

    /**
     * Set end location
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     */
    setEndLocation(lat, lng) {
        this.endLocation = { lat, lng };
        if (this.endMarker) this.map.removeLayer(this.endMarker);
        this.endMarker = L.marker([lat, lng], {color: 'red'}).addTo(this.map);
        this.endMarker.bindPopup('Destination').openPopup();
    }

    /**
     * Find route between start and end locations
     */
    async findRoute() {
        if (!this.startLocation || !this.endLocation) {
            Utils.showToast('Please select both locations', 'warning');
            return;
        }

        Utils.showLoading(true);
        
        try {
            const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${this.startLocation.lng},${this.startLocation.lat};${this.endLocation.lng},${this.endLocation.lat}?overview=full&geometries=geojson`
            );
            const data = await response.json();
            
            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                
                const bounds = Utils.calculateRouteBounds(route.geometry.coordinates);
                const trafficData = await this.trafficProcessor.processTrafficData(route, bounds);
                const adjustedDuration = Utils.calculateTrafficAdjustedTime(route, trafficData);
                
                this.displayRoute(route.geometry.coordinates);
                this.displayRouteInfo(route.distance, adjustedDuration, trafficData);
                this.displayTrafficElements(trafficData);
                
            } else {
                Utils.showToast('No route found', 'error');
            }
        } catch (error) {
            console.error('Routing error:', error);
            Utils.showToast('Routing service unavailable', 'error');
        }
        
        Utils.showLoading(false);
    }

    /**
     * Display route on map
     * @param {Array} coordinates - Route coordinates
     */
    displayRoute(coordinates) {
        this.routeLayer.clearLayers();
        const latLngs = coordinates.map(coord => [coord[1], coord[0]]);
        L.polyline(latLngs, {color: 'blue', weight: 4}).addTo(this.routeLayer);
        this.map.fitBounds(L.polyline(latLngs).getBounds());
    }

    /**
     * Display route information
     * @param {number} distance - Distance in meters
     * @param {number} duration - Duration in seconds
     * @param {Object} trafficData - Traffic data
     */
    displayRouteInfo(distance, duration, trafficData) {
        document.getElementById('distance').textContent = Utils.formatDistance(distance);
        document.getElementById('duration').textContent = Utils.formatDuration(duration);
        document.getElementById('speed').textContent = Utils.calculateSpeed(distance, duration);
        
        document.getElementById('traffic-impact').textContent = 
            (trafficData.trafficMultiplier * 100).toFixed(0) + '%';
        document.getElementById('traffic-signals').textContent = trafficData.totalSignals;
        document.getElementById('construction').textContent = trafficData.constructionZones;
        document.getElementById('closures').textContent = trafficData.roadClosures;
        
        document.getElementById('results').style.display = 'block';
    }

    /**
     * Display traffic elements on map
     * @param {Object} trafficData - Traffic data
     */
    displayTrafficElements(trafficData) {
        if (this.trafficLayer) {
            this.map.removeLayer(this.trafficLayer);
        }
        
        this.trafficLayer = L.layerGroup().addTo(this.map);
        
        // Display traffic signals
        trafficData.rawData.signals.forEach(signal => {
            if (signal.lat && signal.lng) {
                const marker = L.marker([signal.lat, signal.lng], {
                    icon: L.divIcon({
                        className: 'traffic-signal-marker',
                        html: '🚦',
                        iconSize: [20, 20]
                    })
                }).addTo(this.trafficLayer);
                marker.bindPopup('Traffic Signal');
            }
        });
        
        // Display construction zones
        trafficData.rawData.construction.forEach(construction => {
            if (construction.lat && construction.lng) {
                const marker = L.marker([construction.lat, construction.lng], {
                    icon: L.divIcon({
                        className: 'construction-marker',
                        html: '🚧',
                        iconSize: [20, 20]
                    })
                }).addTo(this.trafficLayer);
                marker.bindPopup(`Construction: ${construction.description || 'Road work'}`);
            }
        });
    }

    /**
     * Generate random locations
     */
    generateRandomLocations() {
        const numPoints = parseInt(document.getElementById('numPoints').value);
        const radiusKm = parseFloat(document.getElementById('radiusKm').value);
        
        if (!numPoints || !radiusKm || numPoints < 1 || radiusKm <= 0) {
            Utils.showToast('Please enter valid number of points and radius', 'warning');
            return;
        }
        
        if (!this.userMarker) {
            Utils.showToast('Please get your location first', 'warning');
            return;
        }
        
        const startTime = performance.now();
        Utils.showLoading(true);
        Utils.showToast(`Generating ${numPoints} random points within ${radiusKm}km...`, 'success');
        
        try {
            const userLat = this.userMarker.getLatLng().lat;
            const userLng = this.userMarker.getLatLng().lng;
            
            // Clear only people, keep test centers
            this.clearRandomPoints();
            
            const generatedPoints = this.randomPointGenerator.generatePointsInRadius(
                userLat, userLng, radiusKm, numPoints, 'people'
            );
            
            this.displayRandomPoints(generatedPoints);
            
            const endTime = performance.now();
            const duration = ((endTime - startTime) / 1000).toFixed(3);
            
            Utils.showToast(`Successfully generated ${generatedPoints.length} points in ${duration}s!`, 'success');
            
        } catch (error) {
            console.error('Error generating random locations:', error);
            Utils.showToast('Error generating random locations', 'error');
        }
        
        Utils.showLoading(false);
    }

    /**
     * Display random points on map
     * @param {Array} points - Array of Point objects
     */
    displayRandomPoints(points) {
        this.randomPointsLayer.clearLayers();
        this.randomPoints = points;
        
        if (points.length > 1000) {
            this.displayPointsOptimized(points);
        } else {
            this.displayPointsDetailed(points);
        }
        
        if (points.length > 0) {
            const group = new L.featureGroup(this.randomPointsLayer.getLayers());
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
        
        // Legend is now permanent in sidebar
    }

    /**
     * Display points with detailed information
     * @param {Array} points - Array of Point objects
     */
    displayPointsDetailed(points) {
        points.forEach((point, index) => {
            const marker = L.circleMarker([point.latitude, point.longitude], {
                radius: point.isTestCenter() ? 8 : 6,
                fillColor: point.getDisplayColor(),
                color: point.isTestCenter() ? '#27ae60' : '#2c3e50',
                weight: point.isTestCenter() ? 3 : 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.randomPointsLayer);
            
            marker.bindPopup(point.getDescription());
        });
    }

    /**
     * Display points optimized for large numbers
     * @param {Array} points - Array of Point objects
     */
    displayPointsOptimized(points) {
        points.forEach((point, index) => {
            const marker = L.circleMarker([point.latitude, point.longitude], {
                radius: point.isTestCenter() ? 5 : 3,
                fillColor: point.getDisplayColor(),
                color: point.isTestCenter() ? '#27ae60' : '#2c3e50',
                weight: point.isTestCenter() ? 2 : 1,
                opacity: 0.8,
                fillOpacity: 0.6
            }).addTo(this.randomPointsLayer);
            
            if (index % 100 === 0 || point.isTestCenter()) {
                marker.bindPopup(point.getDescription());
            }
        });
    }

    /**
     * Generate test centers
     */
    generateTestCenters() {
        const numCenters = parseInt(document.getElementById('numTestCenters').value);
        const radiusKm = parseFloat(document.getElementById('radiusKm').value);
        
        if (!numCenters || !radiusKm || numCenters < 1 || radiusKm <= 0) {
            Utils.showToast('Please enter valid number of test centers and radius', 'warning');
            return;
        }
        
        if (!this.userMarker) {
            Utils.showToast('Please get your location first', 'warning');
            return;
        }
        
        const startTime = performance.now();
        Utils.showLoading(true);
        Utils.showToast(`Generating ${numCenters} test centers within ${radiusKm}km...`, 'success');
        
        try {
            const userLat = this.userMarker.getLatLng().lat;
            const userLng = this.userMarker.getLatLng().lng;
            
            this.clearTestCenters();
            
            const generatedCenters = this.randomPointGenerator.generateTestCenters(
                userLat, userLng, radiusKm, numCenters
            );
            
            this.displayTestCenters(generatedCenters);
            
            const endTime = performance.now();
            const duration = ((endTime - startTime) / 1000).toFixed(3);
            
            Utils.showToast(`Successfully generated ${generatedCenters.length} test centers in ${duration}s!`, 'success');
            
        } catch (error) {
            console.error('Error generating test centers:', error);
            Utils.showToast('Error generating test centers', 'error');
        }
        
        Utils.showLoading(false);
    }

    /**
     * Display test centers on map
     * @param {Array} centers - Array of test center Point objects
     */
    displayTestCenters(centers) {
        centers.forEach((center, index) => {
            const marker = L.circleMarker([center.latitude, center.longitude], {
                radius: 8,
                fillColor: center.getDisplayColor(),
                color: '#27ae60',
                weight: 3,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.randomPointsLayer);
            
            marker.bindPopup(center.getDescription());
        });
        
        this.testCenters = this.testCenters.concat(centers);
        
        // Legend is now permanent in sidebar
    }

    /**
     * Clear test centers
     */
    clearTestCenters() {
        // Remove only test center markers
        this.randomPointsLayer.eachLayer((layer) => {
            if (layer instanceof L.CircleMarker) {
                const latLng = layer.getLatLng();
                const isTestCenter = this.testCenters.some(center => 
                    Math.abs(center.latitude - latLng.lat) < 0.0001 && 
                    Math.abs(center.longitude - latLng.lng) < 0.0001
                );
                if (isTestCenter) {
                    this.randomPointsLayer.removeLayer(layer);
                }
            }
        });
        this.testCenters = [];
    }

    /**
     * Clear random points (people only)
     */
    clearRandomPoints() {
        // Remove only people markers, keep test centers
        this.randomPointsLayer.eachLayer((layer) => {
            if (layer instanceof L.CircleMarker) {
                const latLng = layer.getLatLng();
                const isPerson = this.randomPoints.some(person => 
                    Math.abs(person.latitude - latLng.lat) < 0.0001 && 
                    Math.abs(person.longitude - latLng.lng) < 0.0001
                );
                if (isPerson) {
                    this.randomPointsLayer.removeLayer(layer);
                }
            }
        });
        this.randomPoints = [];
        
        // Legend is now permanent in sidebar
    }

    /**
     * Clear route
     */
    clearRoute() {
        if (this.startMarker) this.map.removeLayer(this.startMarker);
        if (this.endMarker) this.map.removeLayer(this.endMarker);
        this.routeLayer.clearLayers();
        if (this.trafficLayer) this.map.removeLayer(this.trafficLayer);
        
        this.startLocation = null;
        this.endLocation = null;
        
        document.getElementById('results').style.display = 'none';
        document.getElementById('start').value = '';
        document.getElementById('end').value = '';
    }
}

// Initialize application when page loads
window.addEventListener('load', () => {
    new RouteAnalyzerApp();
});
