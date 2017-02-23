import numpy as np
from sklearn.cluster import KMeans
from shapely.geometry import Point


def pToAr(ps):
    new_p = []
    for point in ps:
        new_p.append([point.x, point.y])
    return np.array(new_p)


def arToP(ar):
    asList = np.ndarray.tolist(ar)
    ret_final = []
    for p in asList:
        ret_final.append(Point(p[0], p[1]))
    return ret_final


def get_by_clusters(lab, points):
    clusters = {}
    for i in range(len(points)):
        if not lab[i] in clusters:
            clusters[lab[i]] = []
        clusters[lab[i]].append(points[i])
    return clusters


def getKClusters(points, k):
    np_a = pToAr(points)
    kmeans = KMeans(n_clusters=k).fit(np_a)
    lab = kmeans.labels_
    print(kmeans.labels_)
    print(lab)
    return get_by_clusters(lab, points)