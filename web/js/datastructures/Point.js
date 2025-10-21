/**
 * Point Data Structure
 * Represents a geographic point with latitude and longitude
 */

class Point {
    constructor(latitude = 0.0, longitude = 0.0, type = 'person', category = 'male') {
        this.latitude = latitude;
        this.longitude = longitude;
        this.type = type; // 'person' or 'test_center'
        this.category = category; // 'male', 'female', 'pwd' for people; 'center' for test centers
    }

    /**
     * Calculate distance to another point using Haversine formula
     * @param {Point} other - The other point
     * @returns {number} Distance in kilometers
     */
    distanceTo(other) {
        const R = 6371; // Earth's radius in km
        const dLat = this.degreesToRadians(other.latitude - this.latitude);
        const dLng = this.degreesToRadians(other.longitude - this.longitude);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(this.degreesToRadians(this.latitude)) * 
                  Math.cos(this.degreesToRadians(other.latitude)) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees - Degrees to convert
     * @returns {number} Radians
     */
    degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * Check if point is within geographic bounds
     * @returns {boolean} True if valid coordinates
     */
    isValid() {
        return this.latitude >= -90 && this.latitude <= 90 &&
               this.longitude >= -180 && this.longitude <= 180;
    }

    /**
     * Get string representation
     * @returns {string} Point coordinates as string
     */
    toString() {
        return `(${this.latitude.toFixed(6)}, ${this.longitude.toFixed(6)})`;
    }

    /**
     * Create point from object
     * @param {Object} obj - Object with lat/lng properties
     * @returns {Point} New Point instance
     */
    static fromObject(obj) {
        return new Point(obj.lat || obj.latitude, obj.lng || obj.longitude);
    }

    /**
     * Create point from array
     * @param {number[]} coords - Array [lat, lng]
     * @returns {Point} New Point instance
     */
    static fromArray(coords) {
        return new Point(coords[0], coords[1]);
    }

    /**
     * Check if this point is a person
     * @returns {boolean} True if point represents a person
     */
    isPerson() {
        return this.type === 'person';
    }

    /**
     * Check if this point is a test center
     * @returns {boolean} True if point represents a test center
     */
    isTestCenter() {
        return this.type === 'test_center';
    }

    /**
     * Get person category
     * @returns {string} Person category (male, female, pwd)
     */
    getPersonCategory() {
        return this.isPerson() ? this.category : null;
    }

    /**
     * Get display color based on type and category
     * @returns {string} Color code for visualization
     */
    getDisplayColor() {
        if (this.isTestCenter()) {
            return '#2ecc71'; // Green for test centers
        }
        
        switch (this.category) {
            case 'male': return '#3498db'; // Blue for male
            case 'female': return '#e74c3c'; // Red for female
            case 'pwd': return '#f39c12'; // Orange for PWD
            default: return '#95a5a6'; // Gray default
        }
    }

    /**
     * Get display icon based on type and category
     * @returns {string} Icon/emoji for visualization
     */
    getDisplayIcon() {
        if (this.isTestCenter()) {
            return '🏥'; // Hospital for test centers
        }
        
        switch (this.category) {
            case 'male': return '👨'; // Male person
            case 'female': return '👩'; // Female person
            case 'pwd': return '♿'; // Wheelchair for PWD
            default: return '👤'; // Generic person
        }
    }

    /**
     * Get detailed description
     * @returns {string} Detailed description of the point
     */
    getDescription() {
        if (this.isTestCenter()) {
            return `Test Center<br>Lat: ${this.latitude.toFixed(6)}<br>Lng: ${this.longitude.toFixed(6)}`;
        }
        
        const categoryNames = {
            'male': 'Male',
            'female': 'Female',
            'pwd': 'Person with Disability'
        };
        
        return `${categoryNames[this.category] || 'Person'}<br>Lat: ${this.latitude.toFixed(6)}<br>Lng: ${this.longitude.toFixed(6)}`;
    }
}
