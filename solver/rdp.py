from shapely.geometry import LineString, Point
from math import sqrt
import time
import numpy as np
# EXPANDING ON https://github.com/fhirschmann/rdp
MAX_RDP_RUNTIME = 2.0  # in seconds


def rdp_top_level(points, obstacles, robots):
    min_x = 0.0
    max_x = 0.0
    min_y = 0.0
    max_y = 0.0
    new_p = []
    for point in points:
        min_x = min(min_x, point.x)
        max_x = max(max_x, point.x)
        min_y = min(min_y, point.y)
        max_y = max(max_y, point.y)
        new_p.append([point.x, point.y])
    epsilon = 0.3 * 10e-2  #
    sq_val = sqrt(sqrt(((max_y - min_y) ** 2) + ((max_x - min_x) ** 2)))
    optimal_epsilon = epsilon
    ret = np.array(new_p)
    orig_time = time.time()
    while time.time() - MAX_RDP_RUNTIME <= orig_time:
        old = ret
        ret = rdp_iter(np.array(new_p), epsilon, obstacles, robots)
        if ret.size >= old.size:
            ret = old
        else:
            optimal_epsilon = epsilon
        #  print(optimal_epsilon)
        epsilon *= 1.5
    asList = np.ndarray.tolist(ret)
    ret_final = []
    for p in asList:
        ret_final.append(Point(p[0], p[1]))
    return ret_final



def pldist(point, start, end):
    """
    Calculates the distance from ``point`` to the line given
    by the points ``start`` and ``end``.
    :param point: a point
    :type point: numpy array
    :param start: a point of the line
    :type start: numpy array
    :param end: another point of the line
    :type end: numpy array
    """
    if np.all(np.equal(start, end)):
        return np.linalg.norm(point - start)

    return np.divide(
            np.abs(np.linalg.norm(np.cross(end - start, start - point))),
            np.linalg.norm(end - start))


def _rdp_iter(M, start_index, last_index, epsilon, obstacles, robots, dist=pldist):
    stk = []
    stk.append([start_index, last_index])
    global_start_index = start_index
    indices = np.ones(last_index - start_index + 1, dtype=bool)
    robots_map = {}
    for robot in robots:
        robots_map[(robot.x * 928398833 + robot.y)] = True
    while stk:
        start_index, last_index = stk.pop()

        dmax = 0.0
        index = start_index

        for i in xrange(index + 1, last_index):
            if indices[i - global_start_index]:
                d = dist(M[i], M[start_index], M[last_index])
                if d > dmax:
                    index = i
                    dmax = d

        if dmax > epsilon:
            stk.append([start_index, index])
            stk.append([index, last_index])
        else:
            start = np.ndarray.tolist(M[start_index - global_start_index])
            end = np.ndarray.tolist(M[last_index - global_start_index])
            p = LineString([start, end])
            simplifiable = True
            if (start[0] * 928398833 + start[1]) in robots_map or (end[0] * 928398833 + end[1]) in robots_map:
                simplifiable = False
            if not simplifiable:
                continue
            for obstacle in obstacles:
                intersection = p.intersection(obstacle)
                if intersection and intersection.geom_type == "MultiPoint":
                    simplifiable = False
                    break
            if simplifiable:
                for i in xrange(start_index + 1, last_index):
                    indices[i - global_start_index] = False
    return indices


def rdp_iter(M, epsilon, obstacles, robots, dist=pldist, return_mask=False):
    """
    Simplifies a given array of points.
    Iterative version.
    :param M: an array
    :type M: numpy array
    :param epsilon: epsilon in the rdp algorithm
    :type epsilon: float
    :param dist: distance function
    :type dist: function with signature ``f(point, start, end)`` -- see :func:`rdp.pldist`
    :param return_mask: return the mask of points to keep instead
    :type return_mask: bool
    """
    # M = np.array(M)
    mask = _rdp_iter(M, 0, len(M) - 1, epsilon, obstacles, robots, dist)

    if return_mask:
        return mask

    return M[mask]
