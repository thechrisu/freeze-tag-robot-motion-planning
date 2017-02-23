# Dijkstra's algorithm for shortest paths
# David Eppstein, UC Irvine, 4 April 2002

# http://aspn.activestate.com/ASPN/Cookbook/Python/Recipe/117228
from priodict import priorityDictionary
import threading

shortestPaths = {}

def Dijkstra(G, start, end=None):
    """
    Find shortest paths from the start vertex to all
    vertices nearer than or equal to the end.

    The input graph G is assumed to have the following
    representation: A vertex can be any object that can
    be used as an index into a dictionary.  G is a
    dictionary, indexed by vertices.  For any vertex v,
    G[v] is itself a dictionary, indexed by the neighbors
    of v.  For any edge v->w, G[v][w] is the length of
    the edge.  This is related to the representation in
    <http://www.python.org/doc/essays/graphs.html>
    where Guido van Rossum suggests representing graphs
    as dictionaries mapping vertices to lists of neighbors,
    however dictionaries of edges have many advantages
    over lists: they can store extra information (here,
    the lengths), they support fast existence tests,
    and they allow easy modification of the graph by edge
    insertion and removal.  Such modifications are not
    needed here but are important in other graph algorithms.
    Since dictionaries obey iterator protocol, a graph
    represented as described here could be handed without
    modification to an algorithm using Guido's representation.

    Of course, G and G[v] need not be Python dict objects;
    they can be any other object that obeys dict protocol,
    for instance a wrapper in which vertices are URLs
    and a call to G[v] loads the web page and finds its links.

    The output is a pair (D,P) where D[v] is the distance
    from start to v and P[v] is the predecessor of v along
    the shortest path from s to v.

    Dijkstra's algorithm is only guaranteed to work correctly
    when all edge lengths are positive. This code does not
    verify this property for all edges (only the edges seen
     before the end vertex is reached), but will correctly
    compute shortest paths even for some graphs with negative
    edges, and will raise an exception if it discovers that
    a negative edge has caused it to make a mistake.
    """
    d_from_src = {}  # dictionary of final distances
    predecessors = {}  # dictionary of predecessors
    Q = priorityDictionary()  # est.dist. of non-final vert.
    Q[start] = 0
    for v in Q:
        d_from_src[v] = Q[v]
        if not end is None and v == end: break

        for w in G[v]:
            vwLength = d_from_src[v] + G[v][w]
            if w in d_from_src:
                if vwLength < d_from_src[w]:
                    raise ValueError, \
                        "Dijkstra: found better path to already-final vertex"
            elif w not in Q or vwLength < Q[w]:
                Q[w] = vwLength
                predecessors[w] = v

    return (d_from_src, predecessors)


def shortestPath(G, start, end=None):
    """
    Find a single shortest path from the given start vertex
    to the given end vertex.
    The input has the same conventions as Dijkstra().
    The output is a list of the vertices in order along
    the shortest path.
    """

    D, P = Dijkstra(G, start, end)
    if end is None:
        for orig_end in len(G):
            path = []
            while 1:
                path.append(end)
                if end == start: break
                end = P[end]
            path.reverse()
            shortestPaths[start][orig_end] = {p: path, c: D[orig_end]}
    else:
        path = []
        orig_end = end
        while 1:
            path.append(end)
            if end == start: break
            end = P[end]
        shortestPaths[orig_end][start] = {p: path, c: D[orig_end]}
        path.reverse()
        shortestPaths[start][orig_end] = {p: path, c: D[orig_end]}

computed = {}


def doWork(G, start):
    shortestPath(G, start)
    computed[start] = True


def sPaths(G):
    threads = []
    for start in G:
        if not start in G:
            w = threading.Thread(target=doWork, args=(G, start))
            w.start()
            threads.append(w)
    for t in threads:
        t.join()
