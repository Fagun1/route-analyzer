/**
 * Priority Queue Data Structure
 * Implements min-heap for Dijkstra's algorithm
 */

class PriorityQueue {
    constructor() {
        this.heap = [];
    }

    /**
     * Add element to priority queue
     * @param {*} element - Element to add
     * @param {number} priority - Priority value (lower = higher priority)
     */
    enqueue(element, priority) {
        const node = { element, priority };
        this.heap.push(node);
        this.bubbleUp(this.heap.length - 1);
    }

    /**
     * Remove and return highest priority element
     * @returns {*} Highest priority element
     */
    dequeue() {
        if (this.isEmpty()) return null;
        
        const min = this.heap[0];
        const last = this.heap.pop();
        
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.bubbleDown(0);
        }
        
        return min.element;
    }

    /**
     * Check if queue is empty
     * @returns {boolean} True if empty
     */
    isEmpty() {
        return this.heap.length === 0;
    }

    /**
     * Get queue size
     * @returns {number} Number of elements
     */
    size() {
        return this.heap.length;
    }

    /**
     * Peek at highest priority element without removing
     * @returns {*} Highest priority element
     */
    peek() {
        return this.isEmpty() ? null : this.heap[0].element;
    }

    /**
     * Bubble up element to maintain heap property
     * @param {number} index - Index to bubble up
     */
    bubbleUp(index) {
        if (index === 0) return;
        
        const parentIndex = Math.floor((index - 1) / 2);
        
        if (this.heap[index].priority < this.heap[parentIndex].priority) {
            this.swap(index, parentIndex);
            this.bubbleUp(parentIndex);
        }
    }

    /**
     * Bubble down element to maintain heap property
     * @param {number} index - Index to bubble down
     */
    bubbleDown(index) {
        const leftChild = 2 * index + 1;
        const rightChild = 2 * index + 2;
        let smallest = index;
        
        if (leftChild < this.heap.length && 
            this.heap[leftChild].priority < this.heap[smallest].priority) {
            smallest = leftChild;
        }
        
        if (rightChild < this.heap.length && 
            this.heap[rightChild].priority < this.heap[smallest].priority) {
            smallest = rightChild;
        }
        
        if (smallest !== index) {
            this.swap(index, smallest);
            this.bubbleDown(smallest);
        }
    }

    /**
     * Swap two elements in heap
     * @param {number} i - First index
     * @param {number} j - Second index
     */
    swap(i, j) {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }

    /**
     * Clear the queue
     */
    clear() {
        this.heap = [];
    }

    /**
     * Get all elements (for debugging)
     * @returns {Array} Array of all elements
     */
    toArray() {
        return this.heap.map(node => node.element);
    }
}
