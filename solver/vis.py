from shapely.geometry import Point, LinearRing, LineString
from multiprocessing import Pool


class VisibilityGraph:

    def __init__(self, robots, obstacles):
        self.visible_graph = {} # point: [edges_from_point]
        self.edges = {}
        self.obstacles = obstacles
        self.points = []

        # add all robots as points
        self.points.extend(robots)

        # add all points from obstacle
        for obstacle in self.obstacles:
            points = list(obstacle.coords)
            self.points.extend(list(map(lambda x: Point(x[0], x[1]), points)))

            for i in range(len(points)):
                if i == 0:
                    self.visible_graph[points[i]] = [Point(points[-1]), Point(points[1])]
                elif i == len(points)-1:
                    self.visible_graph[points[i]] = [Point(points[i-1]), Point(points[0])]
                else:
                    self.visible_graph[points[i]] = [Point(points[i-1]), Point(points[i+1])]

        # append reachable pointsto visible_graph
        for point in self.points:
            for reach in self.points:
                if self.point_to_key(point) not in self.visible_graph:
                    self.visible_graph[self.point_to_key(point)] = []
                edge = self.is_valid_edge(point, reach)
                if edge:
                    self.visible_graph[self.point_to_key(point)].append(reach)

    def is_valid_edge(self, p1, p2):
        p1 = self.point_to_key(p1)
        p2 = self.point_to_key(p2)
        edge = LineString([p1, p2])
        for obstacle in self.obstacles:
            intersection = edge.intersection(obstacle)
            if intersection and intersection.geom_type != "Point":
                return None
        return edge

    def point_to_key(self, point):
        return list(point.coords)[0]

    def edge_to_key(self, edge):
        return str(list(line.coords))
