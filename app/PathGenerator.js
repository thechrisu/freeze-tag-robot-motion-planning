/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2017
 * @license MIT
 */

"use strict";

const PF = require('pathfinding');
const path = require('path');
const Canvas = require('canvas');
const Point = require('./CoordinateHelper').Point;
const Visualizer = require('./Visualizer').Visualizer;
const SafePointHelper = require('./SafePointHelper');
const CPUCount = require('os').cpus().length;
const childProcess = require('child_process');

const PATH_SMOOTHING = true;
const MIN_COST_CUTOFF_FACTOR = 2.2;
const CREATE_SAFE_POINTS = true;
const SAFE_POINT_SEARCH_START_RADIUS = 1;
const MINIMUM_SAFE_POINT_OPENNESS = 0.05;
const THREAD_FILE = 'PathGeneratorThread.js';
const CELLS_PER_UNIT = 6;
const STROKE_WIDTH = 1;
const ALPHA_CUTOFF_FACTOR = 5;

const working_configs = {
    16: {
        PATH_SMOOTHING: true,
        MIN_COST_CUTOFF_FACTOR: 5,
        CREATE_SAFE_POINTS: true,
        SAFE_POINT_SEARCH_START_RADIUS: 1,
        MINIMUM_SAFE_POINT_OPENNESS: 3,
        CELLS_PER_UNIT: 23,
        STROKE_WIDTH: 1.0,
        ALPHA_CUTOFF_FACTOR: 30,
    },
    20: {
        PATH_SMOOTHING: true,
        MIN_COST_CUTOFF_FACTOR: 5,
        CREATE_SAFE_POINTS: true,
        SAFE_POINT_SEARCH_START_RADIUS: 1,
        MINIMUM_SAFE_POINT_OPENNESS: 3,
        CELLS_PER_UNIT: 16,
        STROKE_WIDTH: 1.4,
        ALPHA_CUTOFF_FACTOR: 30,
    },
    21: {
        MIN_COST_CUTOFF_FACTOR: 4,
        CELLS_PER_UNIT: 6,
        STROKE_WIDTH: 0.3,
    },
};

class Path {

    /**
     * @param {Point[]} points
     * @param {number} cost
     * @param startRobot
     * @param endRobot
     */
    constructor(points, cost, startRobot, endRobot) {
        this.points = points;
        this.cost = cost;
        this.startRobot = startRobot;
        this.endRobot = endRobot;
    }

    toJson() {
        let points = [];
        for (let i = 0; i < this.points.length; i++) {
            points.push({x: this.points[i].x, y: this.points[i].y});
        }
        let temp = this.points;
        this.points = points;
        let ret = JSON.stringify(this);
        this.points = temp;
        return JSON.parse(ret); //lol, it's so hacky man, I don't know.. but it's the quickest way to get a deep copy!
    }
}

class PathGenerator {

    /**
     * @param {Problem} problem
     */
    constructor(problem) {
        this.problem = problem;
        this.jobCount = 1;
        this.calculateProblemSize();
    }

    calculateProblemSize() {
        this.calculateAdjustment();
        this.problemWidth = Math.ceil(this.maxX + this.adjustX + this.gridMargin * 2);
        this.problemHeight = Math.ceil(this.maxY + this.adjustY + this.gridMargin * 2);
    }

    calculateAdjustment() {
        this.calculateBoundaries();
        this.adjustX = -this.minX;
        this.adjustY = -this.minY;
        this.gridMargin = 4;
    }

    calculateBoundaries() {
        this.maxX = -Infinity;
        this.maxY = -Infinity;
        this.minX = Infinity;
        this.minY = Infinity;
        let robotCount = this.problem.robotLocations.length;
        let obstacleCount = this.problem.obstacles.length;
        for (let k = 0; k < robotCount; k++) {
            this.updateBoundaries(this.problem.robotLocations[k]);
        }
        for (let j = 0; j < obstacleCount; j++) {
            let pointCount = this.problem.obstacles[j].length;
            for (let k = 0; k < pointCount; k++) {
                this.updateBoundaries(this.problem.obstacles[j][k]);
            }
        }
    }

    /**
     * @param {Point} point
     */
    updateBoundaries(point) {
        if (point.x > this.maxX) this.maxX = point.x;
        if (point.y > this.maxY) this.maxY = point.y;
        if (point.x < this.minX) this.minX = point.x;
        if (point.y < this.minY) this.minY = point.y;
    }

    calculatePaths(callback) {
        this.callback = callback;
        this.paths = {};
        this.jobCount = 0;
        this.calculateSearchDomain();
        this.addJobs();
    }

    calculateSearchDomain() {
        let robotCount = this.problem.robotLocations.length;
        let costs = {};
        let overallMaxOfLocalMinCosts = -Infinity;
        for (let startRobot = 0; startRobot < robotCount; startRobot++) {
            let minCost = Infinity;
            if (!costs[startRobot]) costs[startRobot] = {};
            for (let endRobot = 0; endRobot < robotCount; endRobot++) {
                if (startRobot === endRobot) continue;
                if (!costs[endRobot]) costs[endRobot] = {};
                if (costs[startRobot][endRobot]) continue;
                let cost = PathGenerator.distanceBetweenPoints(
                    this.problem.robotLocations[startRobot],
                    this.problem.robotLocations[endRobot]
                );
                if (cost < minCost) minCost = cost;
                costs[startRobot][endRobot] = cost;
                costs[endRobot][startRobot] = cost;
            }
            if (isFinite(minCost) && minCost > overallMaxOfLocalMinCosts) overallMaxOfLocalMinCosts = minCost;
        }
        this.searchDomains = {};
        let cutoffCost = overallMaxOfLocalMinCosts * MIN_COST_CUTOFF_FACTOR;
        for (let startRobot = 0; startRobot < robotCount; startRobot++) {
            if (!this.searchDomains[startRobot]) this.searchDomains[startRobot] = [];
            for (let endRobot = 0; endRobot < robotCount; endRobot++) {
                if (!this.searchDomains[endRobot]) this.searchDomains[endRobot] = [];
                if (this.searchDomains[startRobot].indexOf(endRobot) !== -1) continue;
                if (!costs[startRobot][endRobot]) continue;
                if (costs[startRobot][endRobot] < cutoffCost) {
                    this.searchDomains[startRobot].push(endRobot);
                    this.searchDomains[endRobot].push(startRobot);
                }
            }
        }
    }

    /**
     * @param {Point} a
     * @param {Point} b
     * @return {number}
     */
    static distanceBetweenPoints(a, b) {
        let x = Math.pow(a.x - b.x, 2);
        let y = Math.pow(a.y - b.y, 2);
        return Math.sqrt(x + y);
    }

    addJobs() {
        let localJobCount = 0;
        let obstacleCount = this.problem.obstacles.length;
        let gridMatrix = obstacleCount > 0 ? this.generateGridMatrix(this.problem.obstacles, STROKE_WIDTH) : null;
        let gridMatrixNoStroke = obstacleCount > 0 ? this.generateGridMatrix(this.problem.obstacles, 0) : null;
        this.prepareThreads(gridMatrix);
        this.calculateScaledSafePoints(gridMatrix, gridMatrixNoStroke);
        let robotCount = this.problem.robotLocations.length;
        let processedPaths = {};
        for (let startRobot = 0; startRobot < robotCount; startRobot++) {
            let searchDomain = this.searchDomains[startRobot];
            let searchDomainLength = searchDomain.length;
            console.log('Adding... ' + (startRobot) + ' of ' + robotCount + ', ' + searchDomainLength);
            for (let domainIndex = 0; domainIndex < searchDomainLength; domainIndex++) {

                let endRobot = searchDomain[domainIndex];
                if (processedPaths[startRobot] === undefined) processedPaths[startRobot] = {};
                if (processedPaths[endRobot] === undefined) processedPaths[endRobot] = {};

                if (startRobot === endRobot) continue;
                if (processedPaths[startRobot][endRobot] === true) continue;

                localJobCount++;
                this.jobCount++;

                processedPaths[startRobot][endRobot] = true;
                processedPaths[endRobot][startRobot] = true;

                let dataObject = {
                    smoothing: PATH_SMOOTHING,
                    obstacleCount,
                    startRobot,
                    endRobot,
                    start: this.scalePointToProblem(this.problem.robotLocations[startRobot]),
                    safeStart: this.scaledSafePoints[startRobot],
                    end: this.scalePointToProblem(this.problem.robotLocations[endRobot]),
                    safeEnd: this.scaledSafePoints[endRobot],
                };
                this.calculateUsingThread(dataObject);

            }
        }
        console.log(`--> Added all jobs! (${localJobCount} jobs)`);
    }

    calculateScaledSafePoints(gridMatrix, gridMatrixNoStroke) {
        let robotCount = this.problem.robotLocations.length;
        this.scaledSafePoints = {};
        let counter = 0;
        for (let i = 0; i < robotCount; i++) {
            let point = this.scalePointToProblem(this.problem.robotLocations[i]);
            this.scaledSafePoints[i] = CREATE_SAFE_POINTS ? SafePointHelper.createSafePointIfNeeded(
                    gridMatrix,
                    gridMatrixNoStroke,
                    point,
                    SAFE_POINT_SEARCH_START_RADIUS,
                    MINIMUM_SAFE_POINT_OPENNESS
                ) : null;
            if (this.scaledSafePoints[i]) {
                counter++;
            }
        }
        console.error('Generated ' + counter + ' safe points!');
    }

    calculateUsingThread(data) {
        let thread = this.getLeastBusyThread();
        thread.send(data);
    }

    getLeastBusyThread() {
        if(!this.memoryThread) this.memoryThread = 0;
        else this.memoryThread = (this.memoryThread + 1) % CPUCount;
        return this.threads[this.memoryThread];
        // let threadCount = this.threads.length;
        // let minLoad = Infinity;
        // let i;
        // let threadIndex = 0;
        // for (i = 0; i < threadCount; i++) {
        //     if (this.threadLoad[i] < minLoad) {
        //         minLoad = this.threadLoad[i];
        //         threadIndex = i;
        //     }
        // }
        // this.threadLoad[threadIndex] = this.threadLoad[threadIndex] + 1;
        // return this.threads[threadIndex];
    }

    prepareThreads(gridMatrix) {
        let dataObject = {
            setup: true,
            gridMatrix: gridMatrix,
        };
        this.threadLoad = [];
        this.threads = [];
        for (let i = 0; i < CPUCount; i++) {
            this.threadLoad.push(0);
            let thread = childProcess.fork(path.join(__dirname, THREAD_FILE));
            thread.send(dataObject);
            thread.on('message', (data) => {
                let k = i;
                this.threadLoad[k] = this.threadLoad[k] - 1;
                this.jobCount--;
                this.registerPath(data);
            });
            thread.on('exit', (data) => {
                if (data) {
                    console.error(data);
                }
            });
            this.threads.push(thread);
        }
    }

    killThreads() {
        for (let i = 0; i < CPUCount; i++) {
            this.threads[i].kill();
        }
    }

    registerPath(data) {

        if (data.success) {

            let startRobot = data.startRobot;
            let endRobot = data.endRobot;
            let path = data.path;

            let pointPath = this.convertPathToOriginalScalePoints(path);

            let pathLength = PF.Util.pathLength(path);
            let pointCount = pointPath.length;

            pointPath[0].x = this.problem.robotLocations[startRobot].x;
            pointPath[0].y = this.problem.robotLocations[startRobot].y;
            pointPath[pointCount - 1].x = this.problem.robotLocations[endRobot].x;
            pointPath[pointCount - 1].y = this.problem.robotLocations[endRobot].y;
            if (this.paths[startRobot] === undefined) this.paths[startRobot] = {};
            if (this.paths[endRobot] === undefined) this.paths[endRobot] = {};
            this.paths[startRobot][endRobot] = new Path(pointPath, pathLength, startRobot, endRobot);
            this.paths[endRobot][startRobot] = new Path(pointPath.slice(0).reverse(), pathLength, startRobot, endRobot);
        }

        if (this.jobCount <= 0) {
            this.killThreads();
            this.callback(this.paths);
        }
    }

    /**
     * @param {Array.number[]} path
     * @return {Point[]}
     */
    convertPathToOriginalScalePoints(path) {
        let points = [];
        let length = path.length;
        for (let i = 0; i < length; i++) {
            points.push(this.restorePointScale(new Point(path[i][0], path[i][1])));
        }
        return points;
    }

    /**
     * @param {Array.<Point[]>} obstacles
     * @param {number} strokeWidth
     * @return {Array.<Number[]>}
     */
    generateGridMatrix(obstacles, strokeWidth) {
        console.log('--> Preparing grid matrix...');
        let context = obstacles.length > 0 ? this.generateCanvasContext(obstacles, strokeWidth) : null;
        let width = this.problemWidth * CELLS_PER_UNIT;
        let height = this.problemHeight * CELLS_PER_UNIT;
        let matrix = [];
        for (let y = 0; y < height; y++) {
            let row = [];
            for (let x = 0; x < width; x++) {
                let walkable = !context || context.getImageData(x, y, 1, 1).data['3'] < ALPHA_CUTOFF_FACTOR;
                row.push(walkable ? 0 : 1);
            }
            matrix.push(row);
        }
        console.log('--> Grid matrix ready!');
        return matrix;
    }

    /**
     *
     * @param {Array.<Point[]>} obstacles
     * @param {number} strokeWidth
     * @return {Canvas}
     */
    generateCanvasContext(obstacles, strokeWidth) {
        let canvas = new Canvas(this.problemWidth * CELLS_PER_UNIT, this.problemHeight * CELLS_PER_UNIT);
        if (strokeWidth === 0) {
            Visualizer.saveAsFile('problem' + this.problem.problemNumber + '-obstacles-no-stroke', canvas);
        } else {
            Visualizer.saveAsFile('problem' + this.problem.problemNumber + '-obstacles', canvas);
        }
        let context = canvas.getContext('2d');
        let obstacleCount = obstacles.length;
        for (let i = 0; i < obstacleCount; i++) {
            this.drawObstacle(context, obstacles[i], strokeWidth);
        }
        return context;
    }

    /**
     *
     * @param {Context2d} context
     * @param {Point[]} obstacle
     * @param {number} strokeWidth
     */
    drawObstacle(context, obstacle, strokeWidth) {
        context.fillStyle = '#000';
        if (strokeWidth > 0) {
            context.strokeStyle = '#000';
            context.lineWidth = strokeWidth;
        }
        context.beginPath();
        let pointCount = obstacle.length;
        for (let i = 0; i < pointCount; i++) {
            let point = this.scalePointToProblem(obstacle[i]);
            if (i === 0) context.moveTo(point.x, point.y);
            context.lineTo(point.x, point.y);
        }
        context.closePath();
        if (strokeWidth > 0) {
            context.stroke();
        }
        context.fill();
    }

    /**
     * @param {Point} point
     * @return {Point}
     */
    scalePointToProblem(point) {
        return new Point(
            (point.x + this.adjustX + this.gridMargin) * CELLS_PER_UNIT,
            (point.y + this.adjustY + this.gridMargin) * CELLS_PER_UNIT
        );
    }

    /**
     * @param {Point} point
     * @return {Point}
     */
    restorePointScale(point) {
        return new Point(
            point.x / CELLS_PER_UNIT - this.adjustX - this.gridMargin,
            point.y / CELLS_PER_UNIT - this.adjustY - this.gridMargin
        );
    }

}

module.exports = {PathGenerator, Path};
