inp = "(0,1),(2,0),(3,5),(6,2),(9,0)#(1,2),(1,4),(3,4),(3,2);(8,1),(4,1),(4,4),(5,2)"

def create_list_of_points(a):
    a = "[" + a + "]"
    return eval(a)

def parse(s):
    robots, obstacles = s.split('#')
    robots = create_list_of_points(robots)
    if obstacles:
        obstacles = obstacles.split(';')
        obstacles = [create_list_of_points(i) for i in obstacles]

    return robots, obstacles

print(parse(inp))
