/**
 * Utility Functions
 * Common helper functions for the application
 */

class Utils {
    /**
     * Show loading indicator
     * @param {boolean} show - Whether to show loading
     */
    static showLoading(show) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type (success, error, warning)
     */
    static showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    /**
     * Calculate route bounds from coordinates
     * @param {Array} coordinates - Array of [lng, lat] coordinates
     * @returns {Object} Bounds object
     */
    static calculateRouteBounds(coordinates) {
        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;
        
        coordinates.forEach(coord => {
            const [lng, lat] = coord;
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
        });
        
        // Add padding
        const padding = 0.01;
        return {
            south: minLat - padding,
            north: maxLat + padding,
            west: minLng - padding,
            east: maxLng + padding
        };
    }

    /**
     * Calculate traffic-adjusted time
     * @param {Object} route - Route object
     * @param {Object} trafficData - Traffic data
     * @returns {number} Adjusted duration in seconds
     */
    static calculateTrafficAdjustedTime(route, trafficData) {
        const baseDuration = route.duration; // seconds
        const adjustedDuration = baseDuration * trafficData.trafficMultiplier;
        return Math.round(adjustedDuration);
    }

    /**
     * Format distance for display
     * @param {number} distanceMeters - Distance in meters
     * @returns {string} Formatted distance string
     */
    static formatDistance(distanceMeters) {
        const distanceKm = (distanceMeters / 1000).toFixed(1);
        return `${distanceKm} km`;
    }

    /**
     * Format duration for display
     * @param {number} durationSeconds - Duration in seconds
     * @returns {string} Formatted duration string
     */
    static formatDuration(durationSeconds) {
        const durationMin = Math.round(durationSeconds / 60);
        return `${durationMin} min`;
    }

    /**
     * Calculate average speed
     * @param {number} distanceMeters - Distance in meters
     * @param {number} durationSeconds - Duration in seconds
     * @returns {string} Formatted speed string
     */
    static calculateSpeed(distanceMeters, durationSeconds) {
        const speedKmh = ((distanceMeters / 1000) / (durationSeconds / 3600)).toFixed(1);
        return `${speedKmh} km/h`;
    }

    /**
     * Validate coordinates
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {boolean} True if valid coordinates
     */
    static isValidCoordinates(lat, lng) {
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }

    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Generate unique ID
     * @returns {string} Unique identifier
     */
    static generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Deep clone object
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Check if value is empty
     * @param {*} value - Value to check
     * @returns {boolean} True if empty
     */
    static isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim() === '';
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    /**
     * Format number with commas
     * @param {number} num - Number to format
     * @returns {string} Formatted number string
     */
    static formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Get current timestamp
     * @returns {number} Current timestamp
     */
    static getTimestamp() {
        return Date.now();
    }

    /**
     * Format timestamp to readable date
     * @param {number} timestamp - Timestamp to format
     * @returns {string} Formatted date string
     */
    static formatDate(timestamp) {
        return new Date(timestamp).toLocaleString();
    }
}
