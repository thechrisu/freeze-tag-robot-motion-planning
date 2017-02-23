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
const ClusterSet = require('./Cluster').ClusterSet;

const ENABLE_CLUSTERING = true;
const MAX_NEW_CLUSTERS_PER_STEP = 5; //More new clusters get explored if increased

class Solution {

    /**
     * @param {Problem} problem
     * @param robotPaths
     * @param paths
     */
    constructor(problem, robotPaths, paths) {
        this.problem = problem;
        if (!robotPaths) {
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
        if (!this.paths) {
            generator.calculatePaths(this.computeOptimalPropagation.bind(this));
        } else {
            this.computeOptimalPropagation(this.paths);
        }
        while (!this.complete) {
            deasync.runLoopOnce();
        }
    }

    computeOptimalPropagation(paths) {
        let robotCount = this.setupPropagation(paths);
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

    setupPropagation(paths) {
        console.log('> Found available paths for #' + this.problem.problemNumber + '!');
        this.paths = paths;
        console.timeEnd('> problem-' + this.problem.problemNumber + '-paths');
        this.awakeRobots = [0];
        this.sleepingRobots = [];
        this.robotCount = this.problem.robotLocations.length;
        for (let i = 1; i < this.robotCount; i++) {
            this.sleepingRobots.push(i);
        }
        this.currentLocations = {0: 0};
        this.currentPaths = {0: []};
        console.log('> Calculating robot paths for #' + this.problem.problemNumber + '...');
        console.time('> problem-' + this.problem.problemNumber + '-robot-paths');
        return this.robotCount;
    }

    logPath(path) {
        console.log('Path:');
        for (let i = 0; i < path.length; i++) {
            console.log(path[i].x.toFixed(2), path[i].y.toFixed(2))
        }
    }

    calculateRobotPaths() {
        console.log('==> asleep: ' + this.sleepingRobots.length + ', woken up: '
            + this.awakeRobotCount + ', total: ' + this.robotCount);
        let sleepingRobotCount = this.sleepingRobots.length;
        if (sleepingRobotCount === 0) return;

        let optionsWeActuallyUse = [];
        let allOptions = this.getGreedyOptions(this.awakeRobots, this.sleepingRobots);
        if (ENABLE_CLUSTERING && (this.awakeRobotCount < Math.sqrt(Math.sqrt(this.robotCount)) || this.robotCount < 30)) {
            let optionsForEnteringNewClusters = this.getClusterOptions();
            optionsWeActuallyUse = optionsForEnteringNewClusters.concat(allOptions);
        } else {
            optionsWeActuallyUse = allOptions;
        }

        if (allOptions.length === 0 && this.awakeRobotCount < this.problem.robotLocations.length) {
            console.error('No solution! Dumping results as-is.');
            console.error('Sleeping robots: ' + this.sleepingRobots.length + ', awake robots: ' + this.awakeRobotCount
                + ', total: ' + this.problem.robotLocations.length);
            return false;
            //process.exit(1);
        }

        this.moveBots(optionsWeActuallyUse);
    }

    getClusterOptions() {
        let clusterSet = new ClusterSet();
        clusterSet.createClusters(this.sleepingRobots, this.paths);
        let botsEnteringNewClusters = {};
        let numBotsEnteringNewClusters = 0;
        let optionsForEnteringNewClusters = [];
        for (let i = 0; i < clusterSet.clusters.length && numBotsEnteringNewClusters < MAX_NEW_CLUSTERS_PER_STEP; i++) {
            let unenteredCluster = clusterSet.clusters[i];
            let optionsForCluster = this.getGreedyOptions(this.awakeRobots, unenteredCluster.getRobots()); //TODO: Optimize with k smallest options
            for (let j = 0; j < optionsForCluster.length; j++) {
                let opt = optionsForCluster[j];
                let bot = opt.worker;
                if (botsEnteringNewClusters[bot] === undefined) {
                    botsEnteringNewClusters[bot] = true;
                    numBotsEnteringNewClusters++;
                    optionsForEnteringNewClusters.push(opt);
                    break;
                }
            }
        }
        return optionsForEnteringNewClusters;
    }

    getGreedyOptions(awakeRobots, sleepingRobots) {
        let options = [];
        for (let i = 0; i < awakeRobots.length; i++) {
            let awakeRobot = awakeRobots[i];
            let location = this.currentLocations[awakeRobot];
            for (let k = 0; k < sleepingRobots.length; k++) {
                let sleepingRobot = sleepingRobots[k];
                if (this.paths[location] && this.paths[location][sleepingRobot]) {
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
        return options;
    }

    moveBots(options) {
        let awokenRobots = [];
        let busyRobots = [];
        let optionCount = options.length;

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
            if (lastPoint.x === path[0].x && lastPoint.y === path[0].y) {
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
