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
    let safeStart = data.safeStart;
    let end = data.end;
    let safeEnd = data.safeEnd;

    console.log('==> ' + startRobot + ' -> ' + endRobot);

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
        if (path.length > 0) {
            if (data.smoothing) {
                path = PF.Util.smoothenPath(grid, path);
            }
            if (safeStart !== null) path.unshift([start.x, start.y]);
            if (safeEnd !== null) {
                path.push([end.x, end.y]);
            }
        }
    } else {
        path = [
            [start.x, start.y],
            [end.x, end.y],
        ]
    }

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