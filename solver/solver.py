from shapely.geometry import Point, LinearRing, LineString
#  from vis import VisibilityGraph
import os
import threading

problems = []
probs_to_solve = [24] #[12] + list(range(22, 30))

USER_NAME = 'inugami'
PASS = 'pfsorqi9qp0cq1971l3la66vdl'

class Problem(object):
    def __init__(self, obstacles, robot_locations, problem_number):
        self.obstacles = obstacles
        self.robot_locations = robot_locations
        self.problem_number = problem_number

# inp = "(0,1),(2,0),(3,5),(6,2),(9,0)#(1,2),(1,4),(3,4),(3,2);(8,1),(4,1),(4,4),(5,2)"
# inp = "(1.7611158486517908, -7.747711347622252), (4.545065131048604, 7.011566783399479)#(-0.05704426993442535, 0.0443520770557942), (0.6212640289430875, -1.8371095493596623), (2.502725655358544, -1.1588012504821497);(-0.9064740078013211, 1.5563537277545438), (-2.266583274985843, 3.022676605336006), (-2.999744713776576, 2.3426219717437435), (-2.319690080184314, 1.6094605329530127), (-3.786012957765777, 0.24935126576849131), (-3.1059583241735136, -0.4838101730222415), (-2.3727968853827823, 0.19624446057002065), (-1.6927422517905226, -0.5369169782207104), (-3.159065129371985, -1.8970262454052325), (-2.4790104957797245, -2.6301876841959646), (-1.7458490569889917, -1.9501330506037022), (-1.065794423396728, -2.683294489394432), (-2.53211730097819, -4.043403756578957), (-1.8520626673859293, -4.776565195369688), (-1.118901228595197, -4.096510561777427), (-0.43884659500293377, -4.8296720005681575), (-1.9051694725843982, -6.189781267752679), (-1.225114838992135, -6.9229427065434095), (0.9743694773800569, -4.882778805766625), (-0.38573978980446577, -3.4164559281851647), (0.34742164898626493, -2.736401294592905), (-1.0126876181982591, -1.2700784170114416), (-0.2795261794075282, -0.5900237834191802), (-1.639635446592052, 0.8762990941622821);(0.07994469527374685, 0.11442905065670439), (0.9848878563433552, 1.8979866962721594), (-0.7986697892720992, 2.802929857341768);(0.41548312390178915, 0.3165720753228515), (2.3794211388983237, -0.06151187468226521), (2.7575050889034407, 1.9024261403142697);(2.9212853184366985, 1.1999145575801127), (2.9304269235085063, -0.800064550074941), (3.93041647733604, -0.7954937475390369), (3.9258456748001294, 0.20449580628848785), (5.9258247824551855, 0.213637411360297), (5.921253979919283, 1.2136269651878269), (4.921264426091753, 1.2090561626519234), (4.916693623555849, 2.209045716479447), (6.916672731210905, 2.21818732155125), (6.912101928675, 3.2181768753787843), (3.9121332671924205, 3.2044644677710705), (3.921274872264225, 1.2044853601160173);(-0.5004497882398188, 3.26435635655471), (1.1890571430437014, 4.334667680023231), (0.6539014813094429, 5.179421145664993), (-0.1908519843323171, 4.644265483930732), (-1.2611633078008424, 6.333772415214252), (-2.1059167734426043, 5.7986167534799895), (-1.5707611117083404, 4.953863287838231), (-2.4155145773501014, 4.418707626103973), (-3.4858259008186203, 6.108214557387494), (-4.3305793664603875, 5.5730588956532285), (-3.795423704726121, 4.728305430011468), (-4.640177170367882, 4.1931497682772125), (-3.2602680429918602, 3.8835519643697145), (-2.7251123812576017, 3.038798498727947), (-1.035605449974078, 4.109109822196471);(3.128864905306475, -1.6433917402151164), (1.1779582749371784, -2.083804409857026), (1.3981646097581306, -3.0592577250416726), (2.3736179249427782, -2.8390513902207175), (2.8140305945846795, -4.789958020590016), (3.789483909769334, -4.569751685769063), (3.569277574948381, -3.594298370584413), (4.544730890133035, -3.374092035763459), (3.34907124012743, -2.618845055399764);(1.4031646729685128, 2.7577485857396944), (3.178276861296175, 1.8363492592527606), (4.099676187783109, 3.6114614475804254);(-3.613497663466867, 1.907875201562182), (-5.371517365084969, 2.8614824208734633), (-6.325124584396251, 1.1034627192553605);(6.594276450680278, -4.596777793792488), (4.80693358198492, -3.699333940549381), (4.3582116553633625, -4.593005374897054), (5.251883089711041, -5.04172730151861), (4.354439236467934, -6.8290701702139796), (5.248110670815616, -7.27779209683553), (5.696832597437172, -6.384120662487848), (6.590504031784852, -6.8328425891094025), (5.6930601785417325, -8.620185457804762), (6.5867316128894196, -9.068907384426321), (7.035453539510975, -8.175235950078637), (7.9291249738586504, -8.623957876700192), (7.484175466132523, -7.281564515730959), (7.932897392754088, -6.387893081383274), (6.145554524058721, -5.490449228140166);(-5.53230022144111, -1.1057478417996487), (-6.050967739179587, 0.825827682492116), (-7.016755501325465, 0.5664939236228823), (-6.757421742456229, -0.39929383852300204), (-8.688997266747997, -0.9179613562614731), (-8.42966350787876, -1.883749118407356), (-7.463875745732875, -1.6244153595381219), (-7.204541986863639, -2.590203121684006), (-9.136117511155403, -3.1088706394224834), (-8.876783752286173, -4.074658401568362), (-5.979420465848518, -3.296657124960651), (-6.498087983586993, -1.3650816006688853);(-3.649886963968159, -0.029049669017145133), (-5.623639969803588, -0.35200333745211215), (-5.300686301368623, -2.325756343287544);(-2.76779727331947, -10.222606926590974), (-4.7567676000659915, -10.43236163886658), (-4.651890243928191, -11.426846802239846), (-3.6574050805549287, -11.32196944610204), (-3.4476503682793216, -13.310939772848565), (-2.453165204906054, -13.206062416710761), (-2.5580425610438597, -12.211577253337495), (-1.5635573976706052, -12.106699897199698), (-2.6629199171816658, -11.217092089964236);(5.957043038765268, -1.1251041510017832), (5.6800121116067475, -3.1058246929757605), (7.66073265358072, -3.382855620134287);(-3.146070177724042, -3.5814568540851917), (-5.1460590319063, -3.5747797928509333), (-5.149397562523429, -4.574774219942071), (-4.1494031354323, -4.578112750559195), (-4.156080196666554, -6.578101604741455), (-3.156085769575419, -6.581440135358582), (-3.1527472389583004, -5.581445708267447), (-2.152752811867167, -5.58478423888458), (-3.149408708341172, -4.581451281176319);(8.562188493003658, 1.1696245258451474), (6.562781487414283, 1.1209251829325841), (6.587131158870564, 0.12122168013789159), (7.586834661665251, 0.145571351594177), (7.63553400457783, -1.853835653995205), (8.635237507372516, -1.8294859825389158), (8.610887835916234, -0.8297824797442286), (9.610591338710925, -0.8054328082879403), (8.586538164459943, 0.16992102305045986);(-6.782916172193694, 5.4779140368818116), (-6.828906843642381, 7.477385181494728), (-8.828377988255301, 7.431394510046042);(10.252901230515604, -3.003544318334004), (8.328772611887683, -2.4578987749846695), (8.055949840213016, -3.4199630842986317), (9.01801414952697, -3.692785855973295), (8.472368606177644, -5.616914474601227), (9.434432915491602, -5.8897372462758915), (9.707255687166267, -4.927672936961926), (10.66931999648022, -5.200495708636601), (10.123674453130887, -7.124624327264522), (11.085738762444848, -7.397447098939194), (11.358561534119515, -6.435382789625229), (12.320625843433472, -6.708205561299903), (11.631384305794183, -5.473318480311271), (11.904207077468858, -4.511254170997309), (9.980078458840937, -3.965608627647965);(5.078144240344647, 3.9563259003108913), (7.02338944293929, 3.4915451974170164), (7.255779794386228, 4.464167798714341), (6.283157193088907, 4.696558150161278), (6.747937895982782, 6.641803352755919), (5.77531529468546, 6.874193704202854), (5.542924943238522, 5.901571102905533), (4.570302341941199, 6.133961454352471), (5.310534591791584, 4.928948501608213);(2.059772623223469, -9.575605771852345), (2.247467112144429, -11.566778988533578), (4.238640328825664, -11.37908449961262)"


def create_list_of_points(a):
    a = "[" + a + "]"
    # return [(x*10000, y*10000) for x, y in eval(a)]
    return eval(a)


def parse(s):
    if '#' in s:
        robots, obstacles = s.split('#')
    else:
        robots = s
        obstacles = None
    robots = create_list_of_points(robots)
    robots = [Point(x, y) for x, y in robots]

    if obstacles:
        obstacles = obstacles.split(';')
        obstacles = [LinearRing(create_list_of_points(i)) for i in obstacles]
    else:
        obstacles = []
    return robots, obstacles


class Solution(object):

    def __init__(self, problem):
        self.robots = problem.robot_locations
        self.obstacles = problem.obstacles
        self.problem_number = problem.problem_number
        self.distances = {}
        self.paths = []
        self.generate_distance_matrix()
        self.left = {}
        self.lock = threading.Lock()
        # self.robots_map = {}

        for robot in self.robots:
            self.left[self.point_to_key(robot)] = None
            # self.robots_map[self.point_to_key(robot)] = None

    def point_to_key(self, point):
        return list(point.coords)[0]

    def generate_distance_matrix(self):
        i = 0
        for robot in self.robots:
            print('generating distance matrix for robot ' + str(i+1) + ' of ' + str(len(self.robots)))
            i += 1
            self.distances[self.point_to_key(robot)] = []
            for reach in self.robots:
                if robot is reach:
                    pass
                else:
                    cost = robot.distance(reach)
                    if len(self.obstacles) > 0:
                        num_intersections = self.num_intersections_between_points(robot, reach)
                        if num_intersections > 1:
                            cost *= 7
                    self.distances[self.point_to_key(robot)].append(tuple((reach, cost)))
            self.distances[self.point_to_key(robot)].sort(key=lambda x: x[1], reverse=True)
        print('==> done generating distance matrix')

    def num_intersections_between_points(self, robot, reach):
        p = LineString([(robot.x, robot.y), (reach.x, reach.y)])
        closest_intersection = None
        intersect_end = None
        num_intersections = 0
        for obstacle in self.obstacles:
            intersection = p.intersection(obstacle)
            if intersection and intersection.geom_type == "MultiPoint":
                # using 1 and -1 as maybe more than two intersection points
                temp = list(intersection)
                num_intersections += 1
                intersect_start = temp[0]
                intersect_end = temp[-1]
                if robot.distance(intersect_start) > robot.distance(intersect_end):
                    intersect_start, intersect_end = intersect_end, intersect_start
                if closest_intersection:
                    if robot.distance(intersect_start) < robot.distance(closest_intersection[0]):
                        closest_intersection = (intersect_start, intersect_end, obstacle)
                else:
                    closest_intersection = (intersect_start, intersect_end, obstacle)
        if not closest_intersection:
            return 0
        else:
            return self.num_intersections_between_points(intersect_end, reach) + num_intersections


    def list_of_points_to_path(self, points):
        # print('in total: ' + str(len(points)) + ' num points')
        return (str(self.convert_points_to_tuples(points))[1:-1]).replace("'", "")

    def to_string(self):
        # tuples = self.answer()
        self.answer()

        #  v = VisibilityGraph(self.robots, self.obstacles)

        path = ""
        paths = list(map(self.list_of_points_to_path, self.paths))
        path = "; ".join(paths)
        return (str(self.problem_number) + ':' + path).replace(" ", "")
        #  return str(self.problem_number) + ': ' + path
        # return str(v.visible_graph)

    def remove_duplicates_and_append(self, path):
        unique_path = [path[0]]
        for i in range(1, len(path)):
            if path[i] != path[i-1]:
                unique_path.append(path[i])

        if len(unique_path) < 2:
            return
        else:
            self.paths.append(unique_path)

    def answer(self):
        del self.left[self.point_to_key(self.robots[0])]
        startBot = self.robots[0]
        self.reach_closest_robot(startBot, [startBot])

    def convert_points_to_tuples(self, points):
        # return [(point.x/10000, point.y/10000) for point in points]
        # new_points = []
        # for point in points:
        #     if self.point_to_key(point) in self.robots_map:
        #         new_points.append(tuple(("{0:.16f}".format(point.x), "{0:.16f}".format(point.y))))
        #     else:
        #         new_points.append(tuple(("{0:.11f}".format(point.x), "{0:.11f}".format(point.y))))
        #
        # return new_points
        return [("{0:.11f}".format(point.x), "{0:.11f}".format(point.y)) for point in points]

    def convert_tuples_to_points(self, points):
        return [Point(x, y) for x, y in points]

    def find_closest_robot(self, start):
        with self.lock:
            distances = self.distances[self.point_to_key(start)]
            if distances:
                while distances:
                    closest_robot, minimum_dist = distances.pop()
                    if self.point_to_key(closest_robot) in self.left:
                        del self.left[self.point_to_key(closest_robot)]
                        return closest_robot

            return None

    def reach_closest_robot(self, start, current_path):
        robot = self.find_closest_robot(start)
        #  print(start, robot, current_path)
        if not robot:
            if len(current_path) > 1:
                #  self.paths.append(current_path)
                self.remove_duplicates_and_append(current_path)
            return
        while start:
            start = self.reach_robot(start, robot, current_path)
        current_path.append(robot)
        # print(len(self.left))
        self.reach_closest_robot(robot, current_path)

    def reach_robot(self, start, robot, current_path):
        if start == robot:
            return None
        p = LineString([(start.x, start.y), (robot.x, robot.y)])
        closest_intersection = None
        # print("REACH ROBOT", list(start.coords), list(robot.coords))
        for obstacle in self.obstacles:
            intersection = p.intersection(obstacle)
            if intersection and intersection.geom_type == "MultiPoint":
                # using 1 and -1 as maybe more than two intersection points
                temp = list(intersection)
                intersect_start = temp[0]
                intersect_end = temp[-1]
                if start.distance(intersect_start) > start.distance(intersect_end):
                    intersect_start, intersect_end = intersect_end, intersect_start
                if closest_intersection:
                    if start.distance(intersect_start) < start.distance(closest_intersection[0]):
                        closest_intersection = (intersect_start, intersect_end, obstacle)
                else:
                    closest_intersection = (intersect_start, intersect_end, obstacle)

                    # if robot can be reached without collision
        if not closest_intersection:
            current_path.append(robot)
            return None
            # in case of collision move around obstacle
            # and call function recursively from intersect_end
        else:
            current_path.extend(self.find_points_from_obstacle(*closest_intersection))
            # self.reach_robot(self.path[-1], robot, current_path)
            # to eliminate recursion depth just returning the next start point
            return current_path[-1]

    def get_edge_indices(self, point, coords):
        distances = []
        for i in range(1, len(coords)):
            edge = LineString([coords[i-1], coords[i]])
            distances.append(point.distance(edge))
            if point.distance(edge) < 1e-14:
                return i-1, i

        raise "Point not found"

    def find_length_of_path(self, tuple_points):
        points = self.convert_tuples_to_points(tuple_points)
        distance = 0
        for i in range(1, len(points)):
            distance += points[i].distance(points[i-1])
        return distance

    def find_points_from_obstacle(self, entry, exit, obstacle):
        coords = list(obstacle.coords)
        coords.append(coords[0])
        result = []

        s1, s2 = self.get_edge_indices(entry, coords)
        e1, e2 = self.get_edge_indices(exit, coords)

        intermediate_nodes = None

        # if we hit entry first
        if s1 < e1:
            # p1 = coords[s2:e1+1]
            # p2 = list(reversed(coords[e1+1:] + coords[:s2]))
            # intermediate_nodes = min(p1, p2, key=self.find_length_of_path)
            intermediate_nodes = coords[s2:e1+1]
        else:
            # p1 = list(reversed(coords[e2:s1+1]))
            # p2 = coords[s1+1:] + coords[:e2]
            # intermediate_nodes = min(p1, p2, key=self.find_length_of_path)
            intermediate_nodes = list(reversed(coords[e2:s1+1]))

        # print(intermediate_nodes)
        # print(s1, s2, e1, e2)

        # print(self.convert_points_to_tuples([entry] + self.convert_tuples_to_points(intermediate_nodes) + [exit]))

        return [entry] + self.convert_tuples_to_points(intermediate_nodes) + [exit]
        # return self.convert_tuples_to_points(intermediate_nodes)

robots_file = open('robots.mat', 'r')
for line in robots_file.readlines():
    halves = line.split(':')
    prob_num = int(halves[0])
    robot_locations, obstacles = parse(halves[1])
    problems.append(Problem(obstacles, robot_locations, prob_num))

try:
    os.remove('solver.mat')
except OSError:
    pass
with open('solver.mat', 'a') as sol_file:
    sol_file.writelines(USER_NAME + '\n')
    sol_file.writelines(PASS + '\n')
    for p_ind in probs_to_solve:
        sol = Solution(problems[p_ind])
        sol_str = sol.to_string()
        print('done ' + str(p_ind + 1))
        sol_file.writelines(sol_str + '\n')
