import math
from shapely.geometry import Point
import os

USER_NAME = 'inugami'
PASS = 'pfsorqi9qp0cq1971l3la66vdl'

PROBLEM_FLIE = "robots.mat"
SOLUTION_FILE = "solver.mat"

NUM_SIGNIFICANT_DIGTS = 11

def minimise_file(problem_filename, solution_filename):
	try:
		os.remove('minimised-solution.mat')
	except OSError:
		pass
	with open('minimised-solution.mat', 'a') as min_sol_file:
		bots = get_bots_of_problem_file(problem_filename)
		paths, prob_nums = get_paths_of_solution_file(solution_filename)
		min_sol_file.writelines(USER_NAME + '\n')
		min_sol_file.writelines(PASS + '\n')
		for i in range(len(paths)):
			path = paths[i]
			minimise_line(bots[i], path)
			output_line = to_string(prob_nums[i], path)
			min_sol_file.writelines(output_line + '\n')

def to_string(problem_number, paths):
    #  v = VisibilityGraph(self.robots, self.obstacles)
    path = ""
    paths = list(map(list_of_points_to_path, paths))
    path = "; ".join(paths)
    return (str(problem_number) + ':' + path).replace(" ", "")

def list_of_points_to_path(points):
    return (str(convert_points_to_tuples(points))[1:-1]).replace("'", "")

def create_list_of_points(a):
    a = "[" + a + "]"
    return eval(a)

def convert_points_to_tuples(points):
    return [(point.x, point.y) for point in points]


def parse(s):
    if '#' in s:
        robots, obstacles = s.split('#')
    else:
        robots = s
    robots = create_list_of_points(robots)
    robots = [Point(x, y) for x, y in robots]
    return robots


def get_bots_of_problem_file(f):
	paths = []
	robots_file = open(f, 'r')
	prob_nums = []
	for line in robots_file.readlines():
		halves = line.split(':')
		prob_num = int(halves[0])
		prob_nums.append(prob_num)
    	paths.append(parse(halves[1]))
	return paths


def get_paths_of_solution_file(f):
	paths = []
	robots_file = open(f, 'r')
	i = 0
	prob_nums = []
	for line in robots_file.readlines():
		if i < 2:
			i += 1
			continue
		paths_for_s = []
    	halves = line.split(':')
    	prob_num = int(halves[0])
    	prob_nums.append(prob_num)
    	paths_by_robot = halves[1].split(';')
    	for p_str in paths_by_robot:
    		paths_for_s.append(parse(p_str))
    	paths.append(paths_for_s)
	return paths, prob_nums

def minimise_line(robots, paths):
	robot_dict = generate_dict(robots)
	print(robot_dict)
	for path in paths:
		for i in range(len(path)):
			point = path[i]
			if not list(point.coords)[0] in robot_dict:
				path[i] = Point(truncate(point.x, NUM_SIGNIFICANT_DIGTS), truncate(point.y, NUM_SIGNIFICANT_DIGTS))
			else:
				print('ROBOT')
				pass


def generate_dict(robots):
	robot_dict = {}
	for robot in robots:
		robot_dict[list(robot.coords)[0]] = True
	return robot_dict


def truncate(f, n):
    return round(f, n)

minimise_file(PROBLEM_FLIE, SOLUTION_FILE)
