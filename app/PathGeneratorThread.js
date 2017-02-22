/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2017
 * @license MIT
 */

"use strict";

const PF = require('pathfinding');
const Point = require('./CoordinateHelper').Point;

let finder = new PF.AStarFinder({
    allowDiagonal: true,
    dontCrossCorners: true,
});

let createSafePointIfNeeded = (gridMatrix, point) => {
    let x = Math.round(point.x);
    let y = Math.round(point.y);
    if (gridMatrix[y][x] === 1) {
        let radius = 1;
        let safePoint = null;
        safeFinder: while (safePoint === null) {
            let minX = x - radius;
            let maxX = x + radius;
            let minY = y - radius;
            let maxY = y + radius;
            for (let sx = minX; sx <= maxX; sx++) {
                for (let sy = minY; sy <= maxY; sy++) {
                    if ((sx < maxX || sx > minX) && (sy < maxY || sy > minY)) continue;
                    if (gridMatrix[sy][sx] === 0) {
                        safePoint = new Point(sx, sy);
                        break safeFinder;
                    }
                }
            }
            radius++;
        }
        return safePoint;
    }
    return null;
};

process.on('message', (data) => {

    let safePoints = data.safePoints;
    let obstacleCount = data.obstacleCount;
    let startRobot = data.startRobot;
    let endRobot = data.endRobot;
    let start = data.start;
    let end = data.end;

    console.log('==> ' + startRobot + ' -> ' + endRobot + ' strt');

    let safeStart = safePoints ? createSafePointIfNeeded(data.gridMatrix, start) : null;
    let safeEnd = safePoints ? createSafePointIfNeeded(data.gridMatrix, end) : null;

    let path;

    if (obstacleCount > 0) {
        let pathStart = safeStart !== null ? safeStart : start;
        let pathEnd = safeEnd !== null ? safeEnd : end;
        let grid = new PF.Grid(data.gridMatrix);
        path = PF.Util.compressPath(finder.findPath(
            Math.round(pathStart.x),
            Math.round(pathStart.y),
            Math.round(pathEnd.x),
            Math.round(pathEnd.y),
            grid
        ));
    } else {
        path = [
            [start.x, start.y],
            [end.x, end.y],
        ]
    }

    if(safePoints) {
        if(safeStart !== null) path.unshift([start.x, start.y]);
        if(safeEnd !== null) path.push([end.x, end.y]);
    }

    console.log('==> ' + startRobot + ' -> ' + endRobot + ' done');

    if (path.length === 0) {
        process.send({
            success: false,
        });
        return;
    }


    process.send({
        success: true,
        startRobot,
        endRobot,
        path,
    });

});