/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2017
 * @license MIT
 */

"use strict";

const CoordinateHelper = require('./CoordinateHelper');

class Solution {

    /**
     * @param {Problem} problem
     * @param robotPaths
     */
    constructor(problem, robotPaths) {
        this.robotLocations = problem.robotLocations;
        this.problemNumber = problem.problemNumber;
        this.obstacles = problem.obstacles;
        if(!robotPaths) {
            /**
             * @type {Array.<Point[]>}
             */
            this.robotPaths = [];
        } else {
            this.robotPaths = robotPaths;
        }
    }

    solve() {
        this.robotPaths.push(this.robotLocations);
    }

    toString() {
        return CoordinateHelper.stringifyPoint2DArray(this.robotPaths);
    }
}

module.exports = Solution;
