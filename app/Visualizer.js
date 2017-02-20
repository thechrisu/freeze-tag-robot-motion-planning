/**
 * Created by c on 20/02/17.
 */

"use strict";

var solEx = {
    robotPaths: [
        [
            {
                x: 3.2,
                y: 2.1
            },
            {
                x: 6.6,
                y: 30.2
            }
        ]
    ],
    obstacles: [
        [
            {
                x: 2.1,
                y: 5.5
            },
            {
                x: 5.5,
                y: 4.4
            },
            {
                x: 10.0,
                y: 10.1
            }
        ]
    ],
    robotLocations: [
        {
            x: 3.2,
            y: 2.1
        }
    ]
};

const MAX_DRAWING_SIZE = 1000.0;
const REAL_DRAWING_SIZE = 900.0;
const DOT_SIZE = 5.0;

var Canvas = require('canvas');
var fs = require('fs');

function getScaledPoint(point, scale) {
    return {
        x: ((point.x - scale.x_offset) * scale.factor) + scale.post_offset,
        y: ((point.y - scale.y_offset) * scale.factor) + scale.post_offset
    }
}

function drawRobotPath(points, ctx, scale) {
    do {
        ctx.strokeStyle = "#" + ((1 << 24) * Math.random() | 2).toString(16);
    } while (ctx.strokeStyle == "#ffffff" || (ctx.strokeStyle[1] < '8' && ctx.strokeStyle[3] < '8' && ctx.strokeStyle[5] < '8'));
    ctx.beginPath();
    var fp = getScaledPoint(points[0], scale);
    ctx.moveTo(fp.x, fp.y);
    ctx.fillStyle = ctx.strokeStyle;
    for (var i = 0; i < points.length; i++) {
        var sp = getScaledPoint(points[i], scale);
        ctx.lineTo(sp.x, sp.y);
    }
    ctx.stroke();
}

function drawObstacle(points, ctx, scale) {
    // console.log('printing obs: ' + points.length + '; ' + JSON.stringify(points));
    do {
        ctx.fillStyle = "#" + ((1 << 24) * Math.random() | 2).toString(16);
    } while (ctx.fillStyle == "#ffffff" || (ctx.fillStyle[1] < '8' && ctx.fillStyle[3] < '8' && ctx.fillStyle[5] < '8'));
    ctx.beginPath();
    var fp = getScaledPoint(points[0], scale);
    ctx.moveTo(fp.x, fp.y);
    for (var i = 0; i < points.length; i++) {
        var sp = getScaledPoint(points[i], scale);
        ctx.lineTo(sp.x, sp.y);
    }
    ctx.closePath();
    ctx.fill();
}

function drawRobotLocations(points, ctx, scale) {
    ctx.fillStyle = 'black';
    for (var i = 0; i < points.length; i++) {
        var sp = getScaledPoint(points[i], scale);
        ctx.fillRect(sp.x - 0.5 * DOT_SIZE / scale.factor, sp.y - 0.5 * DOT_SIZE / scale.factor, DOT_SIZE, DOT_SIZE);
    }
}

/**
 * @param solutionObj
 * @returns {{x_offset: number, y_offset: number, factor: number, post_offset: number}}
 */
function getScale(solutionObj) {
    var raw_max_x = 0.0,
        raw_max_y = 0.0,
        raw_min_x = 0.0,
        raw_min_y = 0.0;
    for (var i = 0; i < solutionObj.robotPaths.length; i++) {
        var pts = solutionObj.robotPaths[i];
        for (var j = 0; j < pts.length; j++) {
            var pt = pts[j];
            if (pt.x > raw_max_x) {
                raw_max_x = pt.x;
            }
            if (pt.y > raw_max_y) {
                raw_max_y = pt.y;
            }
            if (pt.x < raw_min_x) {
                raw_min_x = pt.x;
            }
            if (pt.y < raw_min_y) {
                raw_min_y = pt.y;
            }
        }
    }
    for (var j = 0; j < solutionObj.robotLocations.length; j++) {
        var pt = solutionObj.robotLocations[j];
        if (pt.x > raw_max_x) {
            raw_max_x = pt.x;
        }
        if (pt.y > raw_max_y) {
            raw_max_y = pt.y;
        }
        if (pt.x < raw_min_x) {
            raw_min_x = pt.x;
        }
        if (pt.y < raw_min_y) {
            raw_min_y = pt.y;
        }
    }
    for (var i = 0; i < solutionObj.obstacles.length; i++) {
        var pts = solutionObj.obstacles[i];
        for (var j = 0; j < pts.length; j++) {
            if (pts.x > raw_max_x) {
                raw_max_x = pts.x;
            }
            if (pts.y > raw_max_y) {
                raw_max_y = pts.y;
            }
            if (pts.x < raw_min_x) {
                raw_min_x = pts.x;
            }
            if (pts.y < raw_min_y) {
                raw_min_y = pts.y;
            }
        }
    }
    var x_diff = raw_max_x - raw_min_x;
    if (Math.abs(x_diff) == 0.0)
        x_diff = REAL_DRAWING_SIZE;
    var y_diff = raw_max_y - raw_min_y;
    if (Math.abs(y_diff) == 0.0)
        y_diff = REAL_DRAWING_SIZE;
    var larger_diff = 1.0;
    if (x_diff > y_diff) {
        larger_diff = x_diff;
    } else {
        larger_diff = y_diff;
    }

    return {
        x_offset: raw_min_x,
        y_offset: raw_min_y,
        factor: REAL_DRAWING_SIZE / larger_diff,
        post_offset: (MAX_DRAWING_SIZE - REAL_DRAWING_SIZE) / 2.0
    };
}


class Visualizer {

    /**
     * This is the function you're looking for
     */
    static visualizeSolution(solutionObj, filename) {
        var scale = getScale(solutionObj);
        var canvas = new Canvas(MAX_DRAWING_SIZE, MAX_DRAWING_SIZE);
        var ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.rect(0, 0, MAX_DRAWING_SIZE, MAX_DRAWING_SIZE);
        ctx.fillStyle = 'white';
        ctx.fill();
        drawRobotLocations(solutionObj.robotLocations, ctx, scale);
        ctx.globalAlpha = 0.7;
        // console.log('problem ' + solutionObj.problemNumber);
        for (var i = 0; i < solutionObj.obstacles.length; i++) {
            drawObstacle(solutionObj.obstacles[i], ctx, scale);
        }
        ctx.globalAlpha = 1.0;
        for (var i = 0; i < solutionObj.robotPaths.length; i++) {
            drawRobotPath(solutionObj.robotPaths[i], ctx, scale);
        }
        var out = fs.createWriteStream(__dirname + '/../visualizations/' + filename + '.png');
        var stream = canvas.pngStream();
        stream.on('data', function (c) {
            out.write(c);
        });
        stream.on('end', function () {
            console.log('saved png: ' + filename);
        });
    }

    static visualizeSolutions(solutions) {
        for(let i = 0; i < solutions.length; i++) {
            this.visualizeSolution(solutions[i], 'problem' + solutions[i].problemNumber);
        }
    }
}

module.exports = {
    Visualizer,
    MAX_DRAWING_SIZE,
    REAL_DRAWING_SIZE,
    DOT_SIZE
};
//visualizeSolution(solEx, 'problem');
