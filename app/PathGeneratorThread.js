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

    let startRobot = data.startRobot;
    let endRobot = data.endRobot;
    let start = data.start;
    let end = data.end;
    let grid = new PF.Grid(data.gridMatrix);

    console.log('==> ' + startRobot + ' -> ' + endRobot);

    let path = PF.Util.compressPath(finder.findPath(
        Math.round(start.x),
        Math.round(start.y),
        Math.round(end.x),
        Math.round(end.y),
        grid
    ));

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