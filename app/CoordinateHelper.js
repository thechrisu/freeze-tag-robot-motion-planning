/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2017
 * @license MIT
 */

"use strict";

class Point {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        if(isNaN(x) || isNaN(y)) {
            throw 'Point is null: ' + x + ', ' + y;
        }
        this.x = x;
        this.y = y;
    }
}

class CoordinateHelper {

    /**
     * @param {Point} point
     * @returns {string}
     */
    static stringifyPoint(point) {
        return `(${point.x},${point.y})`;
    }

    /**
     *
     * @param {Point[]} points
     * @returns {string}
     */
    static stringifyPointArray(points) {
        let pointStrings = [];
        for(let i = 0; i < points.length; i++) {
            pointStrings.push(CoordinateHelper.stringifyPoint(points[i]));
        }
        return pointStrings.join(',');
    }

    /**
     *
     * @param {Array.<Point[]>} pointsArray2D
     * @returns {string}
     */
    static stringifyPoint2DArray(pointsArray2D) {
        let pointArrayStrings = [];
        for(let i = 0; i < pointsArray2D.length; i++) {
            pointArrayStrings.push(CoordinateHelper.stringifyPointArray(pointsArray2D[i]));
        }
        return pointArrayStrings.join(';');
    }

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
        //let points = pointArrayString.split(/(\),\s?\()/);
        try {
            for (let i = 0; i < points.length; i++) {
                pointArray.push(CoordinateHelper.extractPoint(points[i]));
            }

            return pointArray;
        } catch (e) {
            console.error('Point was null. Points: ' + points + ' original: ' + pointArrayString);
        }
    }

}

module.exports = {
    Point,
    CoordinateHelper
};
