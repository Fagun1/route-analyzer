/**
 * Graph Data Structure
 * Implements adjacency list representation for weighted graphs
 */

class Graph {
    constructor() {
        this.adjacencyList = new Map();
        this.vertices = new Set();
    }

    /**
     * Add a vertex to the graph
     * @param {string} vertex - The vertex identifier
     */
    addVertex(vertex) {
        if (!this.vertices.has(vertex)) {
            this.vertices.add(vertex);
            this.adjacencyList.set(vertex, []);
        }
    }

    /**
     * Add an edge between two vertices with a weight
     * @param {string} from - Source vertex
     * @param {string} to - Destination vertex
     * @param {number} weight - Edge weight (distance/time)
     */
    addEdge(from, to, weight) {
        this.addVertex(from);
        this.addVertex(to);
        
        // Check if edge already exists
        const existingEdge = this.adjacencyList.get(from).find(edge => edge.vertex === to);
        if (!existingEdge) {
            this.adjacencyList.get(from).push({ vertex: to, weight });
            this.adjacencyList.get(to).push({ vertex: from, weight }); // Undirected graph
        }
    }

    /**
     * Remove a vertex from the graph
     * @param {string} vertex - The vertex to remove
     */
    removeVertex(vertex) {
        if (!this.vertices.has(vertex)) return;
        
        // Remove all edges connected to this vertex
        const neighbors = this.adjacencyList.get(vertex);
        neighbors.forEach(neighbor => {
            const neighborList = this.adjacencyList.get(neighbor.vertex);
            const index = neighborList.findIndex(edge => edge.vertex === vertex);
            if (index !== -1) {
                neighborList.splice(index, 1);
            }
        });
        
        this.adjacencyList.delete(vertex);
        this.vertices.delete(vertex);
    }

    /**
     * Remove an edge between two vertices
     * @param {string} from - Source vertex
     * @param {string} to - Destination vertex
     */
    removeEdge(from, to) {
        if (!this.hasEdge(from, to)) return;
        
        // Remove edge from both directions
        const fromList = this.adjacencyList.get(from);
        const toList = this.adjacencyList.get(to);
        
        const fromIndex = fromList.findIndex(edge => edge.vertex === to);
        const toIndex = toList.findIndex(edge => edge.vertex === from);
        
        if (fromIndex !== -1) fromList.splice(fromIndex, 1);
        if (toIndex !== -1) toList.splice(toIndex, 1);
    }

    /**
     * Check if a vertex exists
     * @param {string} vertex - The vertex to check
     * @returns {boolean} True if vertex exists
     */
    hasVertex(vertex) {
        return this.vertices.has(vertex);
    }

    /**
     * Check if an edge exists
     * @param {string} from - Source vertex
     * @param {string} to - Destination vertex
     * @returns {boolean} True if edge exists
     */
    hasEdge(from, to) {
        if (!this.hasVertex(from) || !this.hasVertex(to)) return false;
        
        return this.adjacencyList.get(from).some(edge => edge.vertex === to);
    }

    /**
     * Get the weight of an edge
     * @param {string} from - Source vertex
     * @param {string} to - Destination vertex
     * @returns {number} Edge weight or -1 if not found
     */
    getEdgeWeight(from, to) {
        if (!this.hasEdge(from, to)) return -1;
        
        const edge = this.adjacencyList.get(from).find(edge => edge.vertex === to);
        return edge ? edge.weight : -1;
    }

    /**
     * Get all neighbors of a vertex
     * @param {string} vertex - The vertex
     * @returns {string[]} Array of neighbor vertices
     */
    getNeighbors(vertex) {
        if (!this.hasVertex(vertex)) return [];
        
        return this.adjacencyList.get(vertex).map(edge => edge.vertex);
    }

    /**
     * Get all vertices
     * @returns {string[]} Array of all vertices
     */
    getVertices() {
        return Array.from(this.vertices);
    }

    /**
     * Get the number of vertices
     * @returns {number} Number of vertices
     */
    getVertexCount() {
        return this.vertices.size;
    }

    /**
     * Get the number of edges
     * @returns {number} Number of edgesu
     */
    getEdgeCount() {
        let count = 0;
        for (const [vertex, edges] of this.adjacencyList) {
            count += edges.length;
        }
        return count / 2; // Divide by 2 for undirected graph
    }

    /**
     * Display the graph structure
     */
    displayGraph() {
        console.log('Vertices:', Array.from(this.vertices).join(' '));
        console.log('Edges:');
        for (const [vertex, edges] of this.adjacencyList) {
            const edgeStr = edges.map(edge => `(${edge.vertex}, ${edge.weight})`).join(', ');
            console.log(`  ${vertex} -> ${edgeStr}`);
        }
    }

    /**
     * Clear the graph
     */
    clear() {
        this.adjacencyList.clear();
        this.vertices.clear();
    }

    /**
     * Get adjacency list (for algorithms)
     * @returns {Map} The adjacency list
     */
    getAdjacencyList() {
        return this.adjacencyList;
    }
}
