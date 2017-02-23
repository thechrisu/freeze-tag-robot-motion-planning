/**
 * Created by c on 22/02/17.
 */

"use strict";

var _ = require("underscore");

class ClusterSet {
    constructor() {
        this.clusters = [];
        this.reverse_map = {};
    }

    /**
     * @deprecated
     * @param botNum
     * @returns {*}
     */
    getClusterWithBot(botNum) {
        return this.reverse_map[botNum];
    }

    createClusters(robots, paths) {
        let numEdgesToKeep;
        numEdgesToKeep = robots.length < 10 ? Math.ceil(0.6 * robots.length) : Math.ceil(Math.sqrt(robots.length));
        let graph = Graph.from(robots, paths);
        //console.log(graph.nodes, graph.edges);
        let mst = (new PrimAlgorithm(graph)).doAlgo();
        //console.log(mst);
        let reducedEdges = graph.trimToNEdges(numEdgesToKeep, mst);
        //console.log(reducedEdges);
        let components = graph.getSetOfConnectedComponents(reducedEdges, robots);
        //console.log(components);
        for (let i = 0; i < components.length; i++) {
            let c = components[i];
            let cl = new Cluster(c);
            this.clusters.push(cl);
            /*for (let j = 0; j < c.length; c++) {
             this.reverse_map[c] = cl;
             }*/
        }
    }
}

class Cluster {
    constructor(points) {
        this.bots = points;
        this.bots_dict = {};
        for (let i = 0; i < this.bots.length; i++) {
            this.bots_dict[this.bots[i]] = true;
        }
    }

    hasRobot(botNum) {
        return this.bots_dict[botNum] !== undefined;
    }

    getRobots() {
        return this.bots;
    }
}

class Edge {
    constructor(startRobot, endRobot, cost) {
        this.startRobot = startRobot;
        this.endRobot = endRobot;
        this.cost = cost;
    }
}

class Graph {
    constructor() {
        this.edges = {};
        this.nodes = [];
    }

    static from(bots, paths) {
        let ret = new Graph();
        ret.edges = paths;
        ret.nodes = bots;
        return ret;
    }

    bfs(v, all_pairs) { //stolen from http://stackoverflow.com/questions/21900713/finding-all-connected-components-of-an-undirected-graph
        let q = [];
        let current_group = [];
        q.push(v);
        while (q.length > 0) {
            v = q.shift();
            if (!this.visited[v]) {
                this.visited[v] = true;
                current_group.push(v);
                for (let i = 0; i < all_pairs.length; i += 1) {
                    let e = all_pairs[i];
                    if (parseInt(e.startRobot) === v && !this.visited[e.endRobot]) {
                        q.push(e.endRobot);
                    } else if (e.endRobot === v && !this.visited[e.startRobot]) {
                        q.push(parseInt(e.startRobot));
                    }
                }
            }
        }
        // return everything in the current "group"
        return current_group;
    }

    getSetOfConnectedComponents(edges, bots) {
        let groups = [];
        this.visited = {};
        for (let i = 0; i < bots.length; i += 1) {
            let b = bots[i];
            /*let e = edges[i];
             let u = parseInt(e.startRobot);
             let v = e.endRobot;
             let src = undefined;
             if (!this.visited[u]) {
             src = u;
             } else if (!this.visited[v]) {
             src = v;
             }*/
            let src = undefined;
            if (!this.visited[b]) {
                src = b;
            }
            if (src !== undefined) {
                groups.push(this.bfs(src, edges));
            }
        }
        return groups;
    }

    // Add a node to the graph
    addNode(node) {
        this.nodes.push(node);
        this.edges[node] = [];
    };

    // Add an edge from startRobot to endRobot with capacity
    addEdge(source, sink, capacity) {
        // Create the two edges = one being the reverse of the other
        this.edges[source].push(new Edge(source, sink, capacity));
        this.edges[sink].push(new Edge(sink, source, capacity));
    };

    // Does edge from startRobot to endRobot exist?
    edgeExists(source, sink) {
        if (this.edges[source] !== undefined)
            for (var i = 0; i < this.edges[source].length; i++)
                if (this.edges[source][i].endRobot == sink)
                    return this.edges[source][i];
        return null;
    };

    trimToNEdges(n, edges) {
        let sortedEdges = _.sortBy(edges, (e) => {
            return -e.cost; //instead of reverse()!
        });
        while (sortedEdges.length > n && sortedEdges.length > 0) {
            sortedEdges.pop();
        }
        this.shortestEdges = sortedEdges;
        return sortedEdges;
    }
}

class PrimAlgorithm {

    constructor(graph) {
        this.re = [];
        this.usedNodes = {};
        this.graph = graph;
    }

    doAlgo() {
        let node = this.graph.nodes[Math.round(Math.random() * (this.graph.nodes.length - 1))];
        this.usedNodes[node] = true;

        let min = this.findMin(this.graph);
        while (min !== undefined) {
            this.re.push(min);
            //this.usedNodes[parseInt(min.startRobot)] = true;
            this.usedNodes[min.endRobot] = true;
            min = this.findMin(this.graph);
        }
        return this.re;
    }

    /**
     * Could optimize to O(nlog(n)), but can't be bothered
     * @param g
     */
    findMin(g) {
        let min = undefined;
        let nodesSoFar = Object.keys(this.usedNodes);
        for (let i = 0; i < nodesSoFar.length; i++) {
            let start = parseInt(nodesSoFar[i]);
            let es = g.edges[start];
            for (let n = 0; n < g.nodes.length; n++) {
                let lucky = g.nodes[n];
                if (lucky == start || this.usedNodes[es[lucky].endRobot] !== undefined) continue;
                if (min === undefined || es[lucky].cost < min.cost) {
                    min = es[lucky];
                }
            }
        }
        return min;
    }
}

/*
 var g = new Graph();

 g.addNode(0);
 g.addNode(1);
 g.addNode(2);
 g.addNode(3);
 g.addNode(4);
 g.addNode(5);

 g.addEdge(0, 1, 1300);
 g.addEdge(1, 2, 300);
 g.addEdge(0, 3, 3000);
 g.addEdge(1, 3, 200);
 g.addEdge(3, 4, 30000);
 g.addEdge(1, 4, 6232451);
 g.addEdge(1, 5, 5242);
 g.addEdge(2, 4, 461);
 g.addEdge(4, 5, 223);
 g.addEdge(2, 5, 424);


 var result = (new PrimAlgorithm(g)).doAlgo();

 */
module.exports = {
    Cluster,
    ClusterSet,
    PrimAlgorithm
};
