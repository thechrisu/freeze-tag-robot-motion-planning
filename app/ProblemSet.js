/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2017
 * @license MIT
 */

"use strict";

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const CoordinateHelper = require('./CoordinateHelper');

class Problem {

    /**
     * @param {Point[]} robotLocations
     * @param {Array.<Point[]>} obstacles
     */
    constructor(robotLocations, obstacles) {
        this.robotLocations = robotLocations;
        this.obstacles = obstacles;
    }

}

class ProblemSet {


    /**
     * @callback problemSetCallback
     * @param {Problem[]} problems
     */

    /**
     * @param {string} problemSetPath
     * @param {problemSetCallback} callback
     */
    static importFromFile(problemSetPath, callback) {
        var lineReader = readline.createInterface({
            input: fs.createReadStream(path.join(process.cwd(), problemSetPath)),
        });

        var problemSets = [];

        lineReader.on('line', (line) => ProblemSet.processLine(problemSets, line));
        lineReader.on('close', () => {
            callback(problemSets);
        });
    }

    static processLine(problemSets, line) {
        let robotLocations;
        let obstacles;

        let data = line.replace(/\d+: /gi, '');
        let parts = data.split('#');
        robotLocations = ProblemSet.processRobotLocations(parts[0]);

        if(parts.length === 2) {
            obstacles = ProblemSet.processObstacles(parts[1]);
        } else {
            obstacles = [];
        }

        problemSets.push(new Problem(robotLocations, obstacles));
    }

    /**
     * @param {string} robotString
     * @returns {Point[]}
     */
    static processRobotLocations(robotString) {
        let noWhitespace = robotString.replace(/\s/gi, '');
        return CoordinateHelper.extractPointArray(noWhitespace);
    }

    /**
     * @param {string} obstacleString
     * @returns {Array.<Point[]>}
     */
    static processObstacles(obstacleString) {
        let obstacles = [];
        let obstacleStringArray = obstacleString.split(';');
        for(let i = 0; i < obstacleStringArray.length; i++) {
            obstacles.push(CoordinateHelper.extractPointArray(obstacleStringArray[i]));
        }
        return obstacles;
    }

}

module.exports = ProblemSet;
