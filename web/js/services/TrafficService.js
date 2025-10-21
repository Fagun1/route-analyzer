/**
 * OpenStreetMap Traffic Service
 * Fetches traffic data from Overpass API
 */

class OpenStreetMapTrafficService {
    constructor() {
        this.baseUrl = 'https://overpass-api.de/api/interpreter';
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes cache
    }

    /**
     * Get traffic data for given bounds
     * @param {Object} bounds - Geographic bounds {south, north, west, east}
     * @returns {Promise<Object>} Traffic data
     */
    async getTrafficData(bounds) {
        const cacheKey = this.getBoundsKey(bounds);
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        const query = this.buildTrafficQuery(bounds);
        const data = await this.executeQuery(query);
        
        this.cache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
        
        return data;
    }

    /**
     * Build Overpass query for traffic data
     * @param {Object} bounds - Geographic bounds
     * @returns {string} Overpass query string
     */
    buildTrafficQuery(bounds) {
        return `
[out:json][timeout:25];
(
  // Traffic signals
  node["highway"="traffic_signals"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
  way["highway"="traffic_signals"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
  
  // Speed limits
  way["maxspeed"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
  
  // Traffic calming measures
  way["traffic_calming"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
  
  // Road restrictions
  relation["type"="restriction"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
  
  // Construction zones
  way["construction"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
  node["construction"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
  
  // Road closures
  way["access"="no"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
  way["motor_vehicle"="no"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
  
  // Bus lanes
  way["bus"]="yes"(${bounds.south},${bounds.west},${bounds.north},${bounds.east});
  
  // One-way streets
  way["oneway"]="yes"(${bounds.south},${bounds.west},${bounds.north},${bounds.east});
);
out geom;
`;
    }

    /**
     * Execute Overpass query
     * @param {string} query - Overpass query
     * @returns {Promise<Object>} Query results
     */
    async executeQuery(query) {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `data=${encodeURIComponent(query)}`
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Overpass API error:', error);
            return { elements: [] };
        }
    }

    /**
     * Generate cache key from bounds
     * @param {Object} bounds - Geographic bounds
     * @returns {string} Cache key
     */
    getBoundsKey(bounds) {
        return `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
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
            timeout: this.cacheTimeout
        };
    }
}
