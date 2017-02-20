from shapely.geometry import Point, LinearRing, LineString


inp = "(0,1),(2,0),(3,5),(6,2),(9,0)#(1,2),(1,4),(3,4),(3,2);(8,1),(4,1),(4,4),(5,2)"

def create_list_of_points(a):
    a = "[" + a + "]"
    return eval(a)

def parse(s):
    robots, obstacles = s.split('#')
    robots = create_list_of_points(robots)
    robots = [Point(x, y) for x, y in robots]

    if obstacles:
        obstacles = obstacles.split(';')
        obstacles = [LinearRing(create_list_of_points(i)) for i in obstacles]

    return robots, obstacles

class Solution(object):
    """docstring for ."""

    def __init__(self, inp):
        robots, obstacles = parse(inp)
        self.robots = robots
        self.obstacles = obstacles
        self.path = []

    def answer(self):
        start = self.robots[0]

        for robot in self.robots[1:]:
            self.reach_robot(start, robot)

        return self.path

    def reach_robot(self, start, robot):
        p = LineString([(start.x, start.y), (robot.x, robot.y)])
        intersections = []

        for obstacle in self.obstacles:
            intersection = p.intersection(obstacle)
            if intersection:
                intersections.append((intersection[0], obstacle))

        if not intersections:
            self.path.append(robot)
            return

        print(intersections)



ans = Solution(inp)

print(ans.answer())
