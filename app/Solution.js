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

    print() {
        let s = "";
        for(let i = 0; i < this.robotPaths.length; i++) {
            let robotPath = this.robotPaths[i];
            for(let j = 0; j < robotPath.length; j++) {
                s += '(' + robotPath[j].x + ',' + robotPath[j].y + ')';
                if(j != robotPath.length - 1) {
                    s += ',';
                } else {
                    s += ';';
                }
            }
        }
        if(s[s.length - 1] == ";") {
            s = s.substr(0, s.length - 1);
        }
        console.log(this.problemNumber + ': ' + s);
    }

    toString() {
        return CoordinateHelper.stringifyPoint2DArray(this.robotPaths);
    }
}

module.exports = Solution;
