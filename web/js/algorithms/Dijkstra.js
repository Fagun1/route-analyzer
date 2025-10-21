/**
 * Dijkstra's Algorithm Implementation
 * Finds shortest path in weighted graph using priority queue
 */

class DijkstraAlgorithm {
    constructor(graph) {
        this.graph = graph;
    }

    /**
     * Find shortest path from start to end vertex
     * @param {string} start - Start vertex
     * @param {string} end - End vertex
     * @returns {Object} {path: string[], distance: number}
     */
    findShortestPath(start, end) {
        if (!this.graph.hasVertex(start) || !this.graph.hasVertex(end)) {
            return { path: [], distance: -1 };
        }

        // Initialize distances and visited set
        const distances = new Map();
        const previous = new Map();
        const visited = new Set();
        const pq = new PriorityQueue();

        // Initialize all distances to infinity
        for (const vertex of this.graph.getVertices()) {
            distances.set(vertex, Infinity);
        }
        distances.set(start, 0);

        // Add start vertex to priority queue
        pq.enqueue(start, 0);

        while (!pq.isEmpty()) {
            const current = pq.dequeue();

            if (visited.has(current)) continue;
            visited.add(current);

            // If we reached the end vertex, we can stop early
            if (current === end) break;

            // Check all neighbors
            const neighbors = this.graph.getNeighbors(current);
            for (const neighbor of neighbors) {
                if (visited.has(neighbor)) continue;

                const edgeWeight = this.graph.getEdgeWeight(current, neighbor);
                const newDistance = distances.get(current) + edgeWeight;

                if (newDistance < distances.get(neighbor)) {
                    distances.set(neighbor, newDistance);
                    previous.set(neighbor, current);
                    pq.enqueue(neighbor, newDistance);
                }
            }
        }

        // Check if path exists
        if (distances.get(end) === Infinity) {
            return { path: [], distance: -1 };
        }

        // Reconstruct path
        const path = this.reconstructPath(previous, start, end);
        return { path, distance: distances.get(end) };
    }

    /**
     * Find shortest distances from start vertex to all other vertices
     * @param {string} start - Start vertex
     * @returns {Map} Map of vertex to distance
     */
    findShortestDistances(start) {
        if (!this.graph.hasVertex(start)) {
            return new Map();
        }

        const distances = new Map();
        const visited = new Set();
        const pq = new PriorityQueue();

        // Initialize all distances to infinity
        for (const vertex of this.graph.getVertices()) {
            distances.set(vertex, Infinity);
        }
        distances.set(start, 0);

        pq.enqueue(start, 0);

        while (!pq.isEmpty()) {
            const current = pq.dequeue();

            if (visited.has(current)) continue;
            visited.add(current);

            const neighbors = this.graph.getNeighbors(current);
            for (const neighbor of neighbors) {
                if (visited.has(neighbor)) continue;

                const edgeWeight = this.graph.getEdgeWeight(current, neighbor);
                const newDistance = distances.get(current) + edgeWeight;

                if (newDistance < distances.get(neighbor)) {
                    distances.set(neighbor, newDistance);
                    pq.enqueue(neighbor, newDistance);
                }
            }
        }

        return distances;
    }

    /**
     * Check if a path exists between two vertices
     * @param {string} start - Start vertex
     * @param {string} end - End vertex
     * @returns {boolean} True if path exists
     */
    pathExists(start, end) {
        const result = this.findShortestPath(start, end);
        return result.path.length > 0;
    }

    /**
     * Get all vertices reachable from start vertex
     * @param {string} start - Start vertex
     * @returns {string[]} Array of reachable vertices
     */
    getReachableVertices(start) {
        const distances = this.findShortestDistances(start);
        const reachable = [];
        
        for (const [vertex, distance] of distances) {
            if (distance !== Infinity) {
                reachable.push(vertex);
            }
        }
        
        return reachable;
    }

    /**
     * Reconstruct path from previous map
     * @param {Map} previous - Map of vertex to previous vertex
     * @param {string} start - Start vertex
     * @param {string} end - End vertex
     * @returns {string[]} Path from start to end
     */
    reconstructPath(previous, start, end) {
        const path = [];
        let current = end;

        while (current !== undefined) {
            path.unshift(current);
            current = previous.get(current);
        }

        return path;
    }

    /**
     * Get algorithm complexity information
     * @returns {Object} Complexity information
     */
    getComplexityInfo() {
        return {
            timeComplexity: 'O((V + E) log V)',
            spaceComplexity: 'O(V)',
            description: 'Dijkstra\'s algorithm with binary heap priority queue'
        };
    }
}
