/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2017
 * @license MIT
 */

"use strict";

const PF = require('pathfinding');
const Canvas = require('canvas');
const Point = require('./CoordinateHelper').Point;

const CELLS_PER_UNIT = 11;

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

    calculatePaths() {
        this.paths = {};

        let grid = new PF.Grid(this.problemWidth * CELLS_PER_UNIT, this.problemHeight * CELLS_PER_UNIT);
        this.addObstaclesToGrid(grid, this.problem.obstacles);
        let finder = new PF.AStarFinder({
            allowDiagonal: true,
            dontCrossCorners: true,
        });
        let robotCount = this.problem.robotLocations.length;
        for (let startRobot = 0; startRobot < robotCount; startRobot++) {
            for (let endRobot = 0; endRobot < robotCount; endRobot++) {
                this.calculatePath(grid.clone(), finder, startRobot, endRobot);
            }
        }
        return this.paths;
    }

    calculatePath(grid, finder, startRobot, endRobot) {
        if (this.paths[startRobot] === undefined) this.paths[startRobot] = {};
        if (this.paths[endRobot] === undefined) this.paths[endRobot] = {};
        if (this.paths[startRobot][endRobot] !== undefined) return;

        let start = this.scalePointToProblem(this.problem.robotLocations[startRobot]);
        let end = this.scalePointToProblem(this.problem.robotLocations[endRobot]);

        let path = PF.Util.compressPath(finder.findPath(
            Math.round(start.x),
            Math.round(start.y),
            Math.round(end.x),
            Math.round(end.y),
            grid
        ));

        if(path.length === 0) return;

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
     *
     * @param {Grid} grid
     * @param {Array.<Point[]>} obstacles
     */
    addObstaclesToGrid(grid, obstacles) {
        let context = this.generateCanvasContext(obstacles);
        let width = this.problemWidth * CELLS_PER_UNIT;
        let height = this.problemHeight * CELLS_PER_UNIT;
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                let walkable = context.getImageData(x, y, 1, 1).data['3'] < 10;
                grid.setWalkableAt(x, y, walkable);
            }
        }

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

module.exports = PathGenerator;
