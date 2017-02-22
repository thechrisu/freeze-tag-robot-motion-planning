/**
 * Created by c on 22/02/17.
 */

"use strict";

var _ = require("underscore");

class ClusterSet {
    constructor() {
        this.clusters = [];
    }

    getClusterWithBot(botNum) {

    }

    createClusters(robots) {
        let graph = Graph.from(robots);
        let mst = (new PrimAlgorithm(graph)).doAlgo();
        let numEdgesToKeep = Math.round(Math.sqrt(robots.length));
        let reducedEdges = mst.removeNLongestEdges(robots.length - numEdgesToKeep);
        let components = graph.getSetOfConnectedComponents(reducedEdges);
        for(let i = 0; i < components.length; i++) {
            this.clusters.push(new Cluster(/* TODO */));
        }
    }
}

class Cluster {
    constructor(points) {
        this.bots = [];
    }

    hasRobot() {

    }

    getRobots() {

    }
}

class Edge {
    constructor(source, sink, cost) {
        this.source = source;
        this.sink = sink;
        this.cost = cost;
    }
}

class Graph {
    constructor() {
        this.edges = {};
        this.nodes = [];
        this.nodeMap = {};

    }

    static from() {
        return new Graph();
    }


    bfs (v, all_pairs, visited) { //stolen from http://stackoverflow.com/questions/21900713/finding-all-connected-components-of-an-undirected-graph
        let q = [];
        let current_group = [];
        let i, nextVertex, pair;
        let length_all_pairs = all_pairs.length;
        q.push(v);
        while (q.length > 0) {
            v = q.shift();
            if (!visited[v]) {
                visited[v] = true;
                current_group.push(v);
                // go through the input array to find vertices that are
                // directly adjacent to the current vertex, and put them
                // onto the queue
                for (i = 0; i < length_all_pairs; i += 1) {
                    pair = all_pairs[i];
                    if (pair[0] === v && !visited[pair[1]]) {
                        q.push(pair[1]);
                    } else if (pair[1] === v && !visited[pair[0]]) {
                        q.push(pair[0]);
                    }
                }
            }
        }
        // return everything in the current "group"
        return current_group;
    }

    getSetOfConnectedComponents(edges) {
        var pairs = [
            ["a2", "a5"],
            ["a3", "a6"],
            ["a4", "a5"],
            ["a7", "a9"]
        ];
        let groups = [];
        let i, k, length, u, v, src, current_pair;
        let visited = {};
        // main loop - find any unvisited vertex from the input array and
        // treat it as the source, then perform a breadth first search from
        // it. All vertices visited from this search belong to the same group
        for (i = 0, length = pairs.length; i < length; i += 1) {
            current_pair = pairs[i];
            u = current_pair[0];
            v = current_pair[1];
            src = null;
            if (!visited[u]) {
                src = u;
            } else if (!visited[v]) {
                src = v;
            }
            if (src) {
                // there is an unvisited vertex in this pair.
                // perform a breadth first search, and push the resulting
                // group onto the list of all groups
                groups.push(this.bfs(src, pairs, visited));
            }
        }
        return groups;
    }

    // Add a node to the graph
    addNode(node) {
        this.nodes.push(node);
        this.nodeMap[node] = this.nodes.length - 1;
        this.edges[node] = [];
    };

    // Add an edge from source to sink with capacity
    addEdge(source, sink, capacity) {
        // Create the two edges = one being the reverse of the other
        this.edges[source].push(new Edge(source, sink, capacity));
        this.edges[sink].push(new Edge(sink, source, capacity));
    };

    // Does edge from source to sink exist?
    edgeExists(source, sink) {
        if (this.edges[source] !== undefined)
            for (var i = 0; i < this.edges[source].length; i++)
                if (this.edges[source][i].sink == sink)
                    return this.edges[source][i];
        return null;
    };

    removeNLongestEdges(n) {
        let edgesAsArray = [];
        let sortedEdges = _.sortBy(edgesAsArray, (e) => { return e.cost });
        while(sortedEdges.length > n && sortedEdges.length > 0) {
            sortedEdges.pop();
        }
        this.nLongestEdges = sortedEdges;
        return sortedEdges;
    }
}

class PrimAlgorithm {

    constructor(graph) {
        this.result = [];
        this.usedNodes = {};
        this.graph = graph;
    }

    doAlgo() {
        let node = this.graph.nodes[Math.round(Math.random() * (this.graph.nodes.length - 1))];
        this.result.push(node);
        this.usedNodes[node] = true;

        var min = this.findMin(this.graph);
        while (min != null) {
            result.push(min);
            this.usedNodes[min] = true;
            min = this.findMin(g);
        }
        return this.result;
    }

    /**
     * Could optimize to O(nlog(n)), but can't be bothered
     * @param g
     */
    findMin(g) {
        let min = [Infinity, null];
        for (var i = 0; i < this.result.length; i++)
            for (var n = 0; n < g.edges[this.result[i]].length; n++)
                if (g.edges[this.result[i]][n].cost < min[0] && this.usedNodes[g.edges[this.result[i]][n].sink] === undefined)
                    min = [g.edges[this.result[i]][n].cost, g.edges[this.result[i]][n].sink];
        return min[1];
    }
}

var g = new Graph();

g.addNode('a');
g.addNode('b');
g.addNode('c');
g.addNode('d');
g.addNode('e');
g.addNode('f');

g.addEdge('a', 'b', 1);
g.addEdge('b', 'c', 3);
g.addEdge('a', 'd', 3);
g.addEdge('b', 'd', 2);
g.addEdge('d', 'e', 3);
g.addEdge('b', 'e', 6);
g.addEdge('b', 'f', 5);
g.addEdge('c', 'e', 4);
g.addEdge('e', 'f', 2);
g.addEdge('c', 'f', 4);

/*
var result = PrimAlgorithm(g).doAlgo();
document.write('<h2>Result</h2>');
document.write(result);

module.exports = {
    Cluster,
    ClusterSet,
    PrimAlgorithm
};
*/