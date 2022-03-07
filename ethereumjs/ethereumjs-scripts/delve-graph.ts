type Node = {[address: string]: string}
type Edge = {src: string, dst: string: string}

export default class DelveGraph {
    _nodes: Node[]
    _edges: Edge[]
    
    constructor(){
        this._nodes = []
        this._edges = []
    }

    /* Getters */

    /**
     * Checks if a given address exists in the graph
     * @param address the ip address of the node
     * @returns true if the node exists in the graph, else false
     */
     nodeExists(address: string) {
        if(address in this._nodes) return true;
        return false;
    }

    

    /* Setters */
    
    /**
     * Adds a node to the node array, updating the lastSeen timestamp if node
     * already exists
     * @param address the ip address of the node
     */
    addNode(address: string) {
        let timestamp = Date()
        if(this.nodeExists(address)) {
            this._nodes[address] = timestamp;
        } else {
            let node : Node = {[address]: timestamp}
            this._nodes.push(node)
        }
    }

    addEdge(src: string, dst: string) {
        this.addNode(src);
        this.addNode(dst);




    }

    printGraph() {
        console.log("%d nodes, %d edges", this._nodes.length, this._edges.length)
    }
}