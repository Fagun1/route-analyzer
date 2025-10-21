/**
 * Traffic Data Processor
 * Processes raw traffic data and calculates impact
 */

class TrafficDataProcessor {
    constructor() {
        this.trafficService = new OpenStreetMapTrafficService();
    }

    /**
     * Process traffic data for a route
     * @param {Object} route - Route object
     * @param {Object} bounds - Route bounds
     * @returns {Promise<Object>} Processed traffic data
     */
    async processTrafficData(route, bounds) {
        const rawData = await this.trafficService.getTrafficData(bounds);
        return this.analyzeTrafficElements(rawData.elements, route);
    }

    /**
     * Analyze traffic elements from raw data
     * @param {Array} elements - Raw traffic elements
     * @param {Object} route - Route object
     * @returns {Object} Analyzed traffic data
     */
    analyzeTrafficElements(elements, route) {
        const trafficData = {
            signals: [],
            speedLimits: [],
            restrictions: [],
            construction: [],
            closures: [],
            busLanes: [],
            oneWay: []
        };
        
        elements.forEach(element => {
            switch (element.type) {
                case 'node':
                    this.processNode(element, trafficData);
                    break;
                case 'way':
                    this.processWay(element, trafficData);
                    break;
                case 'relation':
                    this.processRelation(element, trafficData);
                    break;
            }
        });
        
        return this.calculateTrafficImpact(trafficData, route);
    }

    /**
     * Process node element
     * @param {Object} node - Node element
     * @param {Object} trafficData - Traffic data object
     */
    processNode(node, trafficData) {
        if (node.tags) {
            if (node.tags.highway === 'traffic_signals') {
                trafficData.signals.push({
                    lat: node.lat,
                    lng: node.lon,
                    type: 'traffic_signal'
                });
            }
            
            if (node.tags.construction) {
                trafficData.construction.push({
                    lat: node.lat,
                    lng: node.lon,
                    type: 'construction',
                    description: node.tags.construction
                });
            }
        }
    }

    /**
     * Process way element
     * @param {Object} way - Way element
     * @param {Object} trafficData - Traffic data object
     */
    processWay(way, trafficData) {
        if (way.tags) {
            // Speed limits
            if (way.tags.maxspeed) {
                trafficData.speedLimits.push({
                    way: way,
                    speedLimit: this.parseSpeedLimit(way.tags.maxspeed),
                    type: 'speed_limit'
                });
            }
            
            // Traffic signals
            if (way.tags.highway === 'traffic_signals') {
                trafficData.signals.push({
                    way: way,
                    type: 'traffic_signal'
                });
            }
            
            // Construction
            if (way.tags.construction) {
                trafficData.construction.push({
                    way: way,
                    type: 'construction',
                    description: way.tags.construction
                });
            }
            
            // Road closures
            if (way.tags.access === 'no' || way.tags.motor_vehicle === 'no') {
                trafficData.closures.push({
                    way: way,
                    type: 'closure',
                    reason: way.tags.access === 'no' ? 'access_restricted' : 'motor_vehicle_restricted'
                });
            }
            
            // Bus lanes
            if (way.tags.bus === 'yes') {
                trafficData.busLanes.push({
                    way: way,
                    type: 'bus_lane'
                });
            }
            
            // One-way streets
            if (way.tags.oneway === 'yes') {
                trafficData.oneWay.push({
                    way: way,
                    type: 'one_way'
                });
            }
        }
    }

    /**
     * Process relation element
     * @param {Object} relation - Relation element
     * @param {Object} trafficData - Traffic data object
     */
    processRelation(relation, trafficData) {
        if (relation.tags && relation.tags.type === 'restriction') {
            trafficData.restrictions.push({
                relation: relation,
                type: 'restriction',
                description: relation.tags.restriction
            });
        }
    }

    /**
     * Parse speed limit from string
     * @param {string|number} maxspeed - Speed limit value
     * @returns {number} Parsed speed limit
     */
    parseSpeedLimit(maxspeed) {
        if (typeof maxspeed === 'number') return maxspeed;
        
        const match = maxspeed.toString().match(/(\d+)/);
        return match ? parseInt(match[1]) : 50; // Default 50 km/h
    }

    /**
     * Calculate traffic impact multiplier
     * @param {Object} trafficData - Traffic data
     * @param {Object} route - Route object
     * @returns {Object} Traffic impact analysis
     */
    calculateTrafficImpact(trafficData, route) {
        const impact = {
            totalSignals: trafficData.signals.length,
            averageSpeedLimit: this.calculateAverageSpeedLimit(trafficData.speedLimits),
            constructionZones: trafficData.construction.length,
            roadClosures: trafficData.closures.length,
            busLanes: trafficData.busLanes.length,
            oneWayStreets: trafficData.oneWay.length,
            trafficMultiplier: 1.0,
            rawData: trafficData
        };
        
        // Calculate traffic impact multiplier
        impact.trafficMultiplier = this.calculateTrafficMultiplier(impact);
        
        return impact;
    }

    /**
     * Calculate average speed limit
     * @param {Array} speedLimits - Speed limit data
     * @returns {number} Average speed limit
     */
    calculateAverageSpeedLimit(speedLimits) {
        if (speedLimits.length === 0) return 50; // Default
        
        const totalSpeed = speedLimits.reduce((sum, limit) => sum + limit.speedLimit, 0);
        return totalSpeed / speedLimits.length;
    }

    /**
     * Calculate traffic multiplier based on impact factors
     * @param {Object} impact - Impact data
     * @returns {number} Traffic multiplier
     */
    calculateTrafficMultiplier(impact) {
        let multiplier = 1.0;
        
        // Traffic signals slow down traffic
        multiplier += (impact.totalSignals * 0.05); // 5% per signal
        
        // Construction zones
        multiplier += (impact.constructionZones * 0.2); // 20% per construction zone
        
        // Road closures
        multiplier += (impact.roadClosures * 0.5); // 50% per closure
        
        // Bus lanes can improve traffic flow
        multiplier -= (impact.busLanes * 0.1); // 10% improvement per bus lane
        
        return Math.max(multiplier, 0.5); // Minimum 50% of normal speed
    }
}
