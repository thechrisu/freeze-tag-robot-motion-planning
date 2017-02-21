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
const CPUCount = require('os').cpus().length;
const childProcess = require('child_process');

const THREAD_FILE = 'PathGeneratorThread.js';
const CELLS_PER_UNIT = 3;

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
        for(let i = 0; i < this.points.length; i++) {
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
            let pointCount = this.problem.obstacles[j];
            for (let k = 0; k < pointCount; k++) {
                this.updateBoundaries(this.problem.obstacles[j][k])
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

        this.prepareThreads();
        console.log('--> Preparing grid matrix...');
        let gridMatrix = this.generateGridMatrix(this.problem.obstacles);
        console.log('--> Grid matrix ready!');
        let robotCount = this.problem.robotLocations.length;
        let processedPaths = {};
        for (let startRobot = 0; startRobot < robotCount; startRobot++) {
            for (let endRobot = 0; endRobot < robotCount; endRobot++) {

                if (processedPaths[startRobot] === undefined) processedPaths[startRobot] = {};
                if (processedPaths[endRobot] === undefined) processedPaths[endRobot] = {};

                if (startRobot === endRobot) continue;
                if (processedPaths[startRobot][endRobot] === true) continue;

                this.jobCount++;

                processedPaths[startRobot][endRobot] = true;
                processedPaths[endRobot][startRobot] = true;


                let dataObject = {
                    startRobot,
                    endRobot,
                    start: this.scalePointToProblem(this.problem.robotLocations[startRobot]),
                    end: this.scalePointToProblem(this.problem.robotLocations[endRobot]),
                    gridMatrix,
                };
                this.calculateUsingThread(dataObject);
                //this.calculatePath(grid.clone(), finder, startRobot, endRobot);
            }
        }
    }

    calculateUsingThread(data) {
        let thread = this.getLeastBusyThread();
        thread.send(data);
    }

    getLeastBusyThread() {
        let threadCount = this.threads.length;
        let minLoad = Infinity;
        let i;
        let threadIndex = 0;
        for (i = 0; i < threadCount; i++) {
            if (this.threadLoad[i] < minLoad) {
                minLoad = this.threadLoad[i];
                threadIndex = i;
            }
        }
        i -= 1;
        this.threadLoad[threadIndex] = this.threadLoad[threadIndex] + 1;
        return this.threads[threadIndex];
    }

    prepareThreads() {
        this.threadLoad = [];
        this.threads = [];
        for (let i = 0; i < CPUCount; i++) {
            this.threadLoad.push(0);
            let thread = childProcess.fork(path.join(__dirname, THREAD_FILE));
            thread.on('message', (data) => {
                let k = i;
                this.threadLoad[k] = this.threadLoad[k] - 1;
                this.registerPath(data);
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
        if (!data.success) return;

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
        this.paths[startRobot][endRobot] = new Path(pointPath, pathLength);
        this.paths[endRobot][startRobot] = new Path(pointPath.slice(0).reverse(), pathLength);

        this.jobCount--;

        if (this.jobCount === 0) {
            this.killThreads();
            this.callback(this.paths);
        }
    }

    /**
     * @deprecated
     */
    calculatePath(grid, finder, startRobot, endRobot) {
        if (this.paths[startRobot] === undefined) this.paths[startRobot] = {};
        if (this.paths[endRobot] === undefined) this.paths[endRobot] = {};
        if (this.paths[startRobot][endRobot] !== undefined && this.paths[startRobot][endRobot] !== undefined) {
            return;
        }
        console.log('==> Calculating ' + startRobot + ' -> ' + endRobot);

        let start = this.scalePointToProblem(this.problem.robotLocations[startRobot]);
        let end = this.scalePointToProblem(this.problem.robotLocations[endRobot]);

        let path = PF.Util.compressPath(finder.findPath(
            Math.round(start.x),
            Math.round(start.y),
            Math.round(end.x),
            Math.round(end.y),
            grid
        ));

        if (path.length === 0) return;

        let pointPath = this.convertPathToOriginalScalePoints(path);

        let pathLength = PF.Util.pathLength(path);
        let pointCount = pointPath.length;

        pointPath[0].x = this.problem.robotLocations[startRobot].x;
        pointPath[0].y = this.problem.robotLocations[startRobot].y;
        pointPath[pointCount - 1].x = this.problem.robotLocations[endRobot].x;
        pointPath[pointCount - 1].y = this.problem.robotLocations[endRobot].y;

        this.paths[startRobot][endRobot] = new Path(pointPath, pathLength, startRobot, endRobot);
        this.paths[endRobot][startRobot] = new Path(pointPath.slice(0).reverse(), pathLength, startRobot, endRobot);
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
     * @return {Array.<Number[]>}
     */
    generateGridMatrix(obstacles) {
        let context = obstacles.length > 0 ? this.generateCanvasContext(obstacles) : null;
        let width = this.problemWidth * CELLS_PER_UNIT;
        let height = this.problemHeight * CELLS_PER_UNIT;
        let matrix = [];
        for (let y = 0; y < height; y++) {
            let row = [];
            for (let x = 0; x < width; x++) {
                let walkable = !context || context.getImageData(x, y, 1, 1).data['3'] < 10;
                row.push(walkable ? 0 : 1);
            }
            matrix.push(row);
        }
        return matrix;
    }

    /**
     *
     * @param {Array.<Point[]>} obstacles
     * @return {Canvas}
     */
    generateCanvasContext(obstacles) {
        let canvas = new Canvas(this.problemWidth * CELLS_PER_UNIT, this.problemHeight * CELLS_PER_UNIT);
        let context = canvas.getContext('2d');
        let obstacleCount = obstacles.length;
        for (let i = 0; i < obstacleCount; i++) {
            this.drawObstacle(context, obstacles[i]);
        }
        return context;
    }

    /**
     *
     * @param {Context2d} context
     * @param {Point[]} obstacle
     */
    drawObstacle(context, obstacle) {
        context.fillStyle = '#000';
        context.beginPath();
        let pointCount = obstacle.length;
        for (let i = 0; i < pointCount; i++) {
            let point = this.scalePointToProblem(obstacle[i]);
            if (i === 0) context.moveTo(point.x, point.y);
            context.lineTo(point.x, point.y);
        }
        context.closePath();
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
