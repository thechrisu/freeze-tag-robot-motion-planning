/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2017
 * @license MIT
 */

"use strict";

const PF = require('pathfinding');

let finder = new PF.AStarFinder({
    allowDiagonal: true,
    dontCrossCorners: true,
});

process.on('message', (data) => {

    let obstacleCount = data.obstacleCount;
    let startRobot = data.startRobot;
    let endRobot = data.endRobot;
    let start = data.start;
    let end = data.end;

    console.log('==> ' + startRobot + ' -> ' + endRobot + ' strt');

    let path;

    if (obstacleCount > 0) {
        let grid = new PF.Grid(data.gridMatrix);
        path = PF.Util.compressPath(finder.findPath(
            Math.round(start.x),
            Math.round(start.y),
            Math.round(end.x),
            Math.round(end.y),
            grid
        ));
    } else {
        path = [
            [start.x, start.y],
            [end.x, end.y],
        ]
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