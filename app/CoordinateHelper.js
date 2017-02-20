/**
 * Created by timbokz on 20/02/17.
 */

"use strict";

class Point {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class CoordinateHelper {

    /**
     * @param {string} pointString
     * @returns {Point}
     */
    static extractPoint(pointString) {
        let coordinates = pointString.replace(/(^\(|\($)/, '').split(',');
        return new Point(parseFloat(coordinates[0]), parseFloat(coordinates[1]));
    }

    /**
     *
     * @param {string} pointArrayString
     * @returns {Point[]}
     */
    static extractPointArray(pointArrayString) {
        let pointArray = [];

        let points = pointArrayString.split('),(');
        for(let i = 0; i < points.length; i++) {
            pointArray.push(CoordinateHelper.extractPoint(points[i]));
        }

        return pointArray;
    }

}

module.exports = CoordinateHelper;
