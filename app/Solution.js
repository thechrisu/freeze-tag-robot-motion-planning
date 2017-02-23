/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2017
 * @license MIT
 */

"use strict";

const deasync = require('deasync');
const CoordinateHelper = require('./CoordinateHelper').CoordinateHelper;
const PathGenerator = require('./PathGenerator').PathGenerator;
const fs = require('fs');
const TimSort = require('timsort');

class Solution {

    /**
     * @param {Problem} problem
     * @param robotPaths
     * @param paths
     */
    constructor(problem, robotPaths, paths) {
        this.problem = problem;
        if(!robotPaths) {
            /**
             * @type {Array.<Point[]>}
             */
            this.robotPaths = [];
        } else {
            this.robotPaths = robotPaths;
        }
        this.paths = paths
    }

    /**
     * @deprecated
     */
    getCompressedSolution() {
        return {
            awakeRobots: this.awakeRobots,
            problem: this.problem,
            robotPaths: this.robotPaths,
            paths: this.paths,
            toString: this.toString
        }
    }

    solve() {

        console.log('> Calculating available paths for #' + this.problem.problemNumber + '...');
        console.time('> problem-' + this.problem.problemNumber + '-paths');
        this.complete = false;
        let generator = new PathGenerator(this.problem);
        if(!this.paths) {
            generator.calculatePaths((paths) => {
                this.computeOptimalPropagation(paths);
            });
        } else {
            this.computeOptimalPropagation(this.paths);
        }
        while(!this.complete) {
            deasync.runLoopOnce();
        }
    }

    computeOptimalPropagation(paths) {
        console.log('> Found available paths for #' + this.problem.problemNumber + '!');
        this.paths = paths;
        console.timeEnd('> problem-' + this.problem.problemNumber + '-paths');
        this.awakeRobots = [0];
        this.sleepingRobots = [];
        let robotCount = this.problem.robotLocations.length;
        for (let i = 1; i < robotCount; i++) {
            this.sleepingRobots.push(i);
        }
        this.currentLocations = {0: 0};
        this.currentPaths = {0: []};
        console.log('> Calculating robot paths for #' + this.problem.problemNumber + '...');
        console.time('> problem-' + this.problem.problemNumber + '-robot-paths');
        this.awakeRobotCount = 1;
        while (this.awakeRobotCount < robotCount) {
            if (this.calculateRobotPaths() === false) break;
        }
        for (let i = 0; i < robotCount; i++) {
            if (this.currentPaths[i] !== undefined) {
                this.robotPaths.push(this.currentPaths[i]);
            }
        }
        console.timeEnd('> problem-' + this.problem.problemNumber + '-robot-paths');
        this.complete = true;
    }

    logPath(path) {
        console.log('Path:');
        for(let i = 0; i < path.length; i++) {
            console.log(path[i].x.toFixed(2), path[i].y.toFixed(2))
        }
    }

    calculateRobotPaths() {
        let sleepingRobotCount = this.sleepingRobots.length;
        if (sleepingRobotCount === 0) return;
        let awakeRobotCount = this.awakeRobots.length;

        let options = [];

        for (let i = 0; i < awakeRobotCount; i++) {
            let awakeRobot = this.awakeRobots[i];
            let location = this.currentLocations[awakeRobot];
            for (let k = 0; k < sleepingRobotCount; k++) {
                let sleepingRobot = this.sleepingRobots[k];
                if(this.paths[location] && this.paths[location][sleepingRobot]) {
                    options.push({
                        points: this.paths[location][sleepingRobot].points,
                        cost: this.paths[location][sleepingRobot].cost,
                        worker: awakeRobot,
                        sleeper: sleepingRobot,
                    });
                }
            }
        }

        TimSort.sort(options, (o1, o2) => o1.cost - o2.cost);

        let awokenRobots = [];
        let busyRobots = [];
        let optionCount = options.length;

        if(optionCount === 0 && this.awakeRobotCount < this.problem.robotLocations.length) {
            console.error('No solution! Dumping results as-is.');
            console.error('Sleeping robots: ' + this.sleepingRobots.length + ', awake robots: ' + this.awakeRobotCount
                + ', total: ' + this.problem.robotLocations.length);
            return false;
            //process.exit(1);
        }

        for (let i = 0; i < optionCount; i++) {
            let option = options[i];
            if (awokenRobots.indexOf(option.sleeper) !== -1 || busyRobots.indexOf(option.worker) !== -1) continue;
            awokenRobots.push(option.sleeper);
            busyRobots.push(option.worker);
            this.awakeRobots.push(option.sleeper);
            Solution.removeElementFromArray(this.sleepingRobots, option.sleeper);
            this.currentLocations[option.sleeper] = option.sleeper;
            this.currentLocations[option.worker] = option.sleeper;
            this.appendPath(option.worker, option.points);
            this.awakeRobotCount++;
        }
    }

    appendPath(robot, path) {
        if (this.currentPaths[robot] === undefined) this.currentPaths[robot] = [];
        if (this.currentPaths[robot].length > 0) {
            let lastPoint = this.currentPaths[robot][this.currentPaths[robot].length - 1];
            if(lastPoint.x === path[0].x && lastPoint.y === path[0].y) {
                this.currentPaths[robot] = this.currentPaths[robot].concat(path.slice(1));
                return;
            }
        }
        this.currentPaths[robot] = this.currentPaths[robot].concat(path)
    }

    static removeElementFromArray(array, element) {
        let i = array.indexOf(element);
        if (i != -1) {
            array.splice(i, 1);
        }
    }

    print() {
        console.log(this.problem.problemNumber + ': ' + this.toString());
    }

    save() {
        fs.writeFileSync(process.cwd() + '/sol-quicksave-'
            + this.problem.problemNumber.toString() + '.mat',
            this.problem.problemNumber + ': ' + this.toString());
    }

    toString() {
        return CoordinateHelper.stringifyPoint2DArray(this.robotPaths);
    }
}

module.exports = Solution;
