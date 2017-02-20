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
     */
    constructor(problem) {
        this.robotLocations = problem.robotLocations;
        this.obstacles = problem.obstacles;
        /**
         * @type {Array.<Point[]>}
         */
        this.robotPaths = [];
    }

    solve() {
        this.robotPaths.push(this.robotLocations);
    }

    toString() {
        return CoordinateHelper.stringifyPoint2DArray(this.robotPaths);
    }

}

module.exports = Solution;
