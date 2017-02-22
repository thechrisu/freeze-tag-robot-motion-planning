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


class Visualizer {

    static getScaledPoint(point, scale) {
        return {
            x: ((point.x - scale.x_offset) * scale.factor) + scale.post_offset,
            y: ((point.y - scale.y_offset) * scale.factor) + scale.post_offset
        }
    }

    static getValidColour() {
        let colour = "#ffffff";
        do {
            colour = "#" + ((1 << 24) * Math.random() | 2).toString(16);
        } while (colour == "#ffffff" || (colour[1] < '8' && colour[3] < '8' && colour[5] < '8'));
        return colour;
    }

    /**
     * Please programming gods, forgive me
     * @returns {{x_offset: number, y_offset: number, factor: number, post_offset: number}}
     * @param robotPaths
     * @param robotLocations
     * @param obstacles
     */
    static getScale(robotPaths, robotLocations, obstacles) {
        var raw_max_x = 0.0,
            raw_max_y = 0.0,
            raw_min_x = 0.0,
            raw_min_y = 0.0;
        for (var i = 0; i < robotPaths.length; i++) {
            var pts = robotPaths[i];
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
        for (var i = 0; i < robotLocations.length; i++) {
            var pt = robotLocations[i];
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
        for (var i = 0; i < obstacles.length; i++) {
            var pts = obstacles[i];
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
        var x_diff = raw_max_x - raw_min_x;
        let ret = {
            x_offset: raw_min_x,
            y_offset: raw_min_y,
            post_offset: (MAX_DRAWING_SIZE - REAL_DRAWING_SIZE) / 2.0,
            x_scale: 1.0,
            y_scale: 1.0

        };
        if (Math.abs(x_diff) == 0.0)
            x_diff = REAL_DRAWING_SIZE;
        var y_diff = raw_max_y - raw_min_y;
        if (Math.abs(y_diff) == 0.0)
            y_diff = REAL_DRAWING_SIZE;
        var larger_diff = 1.0;
        if (x_diff > y_diff) {
            larger_diff = x_diff;
            ret.y_scale = y_diff / x_diff;
        } else {
            larger_diff = y_diff;
            ret.x_scale = x_diff / y_diff;
        }
        ret.factor = REAL_DRAWING_SIZE / larger_diff;
        return ret;
    }

    static drawRobotPath(points, ctx, scale) {
        ctx.strokeStyle = Visualizer.getValidColour();
        ctx.beginPath();
        ctx.fillStyle = ctx.strokeStyle;
        for (var i = 0; i < points.length; i++) {
            var sp = Visualizer.getScaledPoint(points[i], scale);
            if (i === 0) ctx.moveTo(sp.x, sp.y);
            ctx.lineTo(sp.x, sp.y);
        }
        ctx.stroke();
    }

    static drawRobotPaths(robotPaths, ctx, scale) {
        ctx.globalAlpha = 1.0;
        for (var i = 0; i < robotPaths.length; i++) {
            Visualizer.drawRobotPath(robotPaths[i], ctx, scale);
        }
    }

    static drawObstacle(points, ctx, scale) {
        ctx.fillStyle = Visualizer.getValidColour();
        ctx.beginPath();
        for (var i = 0; i < points.length; i++) {
            var sp = Visualizer.getScaledPoint(points[i], scale);
            if (i === 0) ctx.moveTo(sp.x, sp.y);
            ctx.lineTo(sp.x, sp.y);
        }
        ctx.closePath();
        ctx.fill();
    }

    static drawObstacles(obstacles, ctx, scale) {
        ctx.globalAlpha = 0.7;
        // console.log('problem ' + solutionObj.problemNumber);
        for (var i = 0; i < obstacles.length; i++) {
            Visualizer.drawObstacle(obstacles[i], ctx, scale);
        }
    }

    static drawRobotLocations(points, ctx, scale, isAwake) {
        if(isAwake) {
            ctx.fillStyle = 'black';
        } else {
            ctx.fillStyle = 'red';
        }
        let f = 1.0;
        if(!isAwake) {
            f = 2.0;
        }
        for (var i = 0; i < points.length; i++) {
            var sp = Visualizer.getScaledPoint(points[i], scale);
            ctx.fillRect(sp.x - 0.5 * f * DOT_SIZE, sp.y - 0.5 * f * DOT_SIZE, f * DOT_SIZE, f * DOT_SIZE);
        }
        ctx.fillStyle = 'black';
    }

    static saveAsFile(filename, canvas) {
        var out = fs.createWriteStream(__dirname + '/../visualizations/' + filename + '.png');
        var stream = canvas.pngStream();
        stream.on('data', function (c) {
            out.write(c);
        });
        stream.on('end', function () {
            console.log('saved png: ' + filename);
        });
    }

    static setupCanvas(scale) {
        var buffer = MAX_DRAWING_SIZE - REAL_DRAWING_SIZE;
        var x_size = buffer + REAL_DRAWING_SIZE * scale.x_scale;
        var y_size = buffer + REAL_DRAWING_SIZE * scale.y_scale;
        var canvas = new Canvas(x_size, y_size);
        var ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.rect(0, 0, x_size, y_size);
        ctx.fill();
        return {canvas: canvas, ctx: ctx};
    }

    static getAsleepRobots(allRobots, awakeRobots) {
        if(!awakeRobots) {
            return [];
        }
        let asleepRobots = [];
        for(let i = 0; i < allRobots.length; i++) {
            let bot = allRobots[i];
            let isAwake = false;
            for(let j = 0; j < awakeRobots.length; j++) {
                let a_bot = awakeRobots[j];
                if(i == a_bot) {
                    isAwake = true;
                }
            }
            if(!isAwake) {
                asleepRobots.push(bot);
            }
        }
        return asleepRobots;
    }

    /**
     * This is the function you're looking for
     */
    static visualizeSolution(solutionObj, filename) {
        var scale = Visualizer.getScale(solutionObj.robotPaths, solutionObj.problem.robotLocations,
            solutionObj.problem.obstacles);
        let cv = this.setupCanvas(scale);
        var canvas = cv.canvas; //Hacky due to canvas :(
        var ctx = cv.ctx;
        let black_robots_to_draw = [];
        if(!solutionObj.awakeRobots) {
            black_robots_to_draw = solutionObj.problem.robotLocations;
        } else {
            let black_robots_locations = [];
            for(let i = 0; i < solutionObj.awakeRobots.length; i++) {
                black_robots_locations.push(solutionObj.problem.robotLocations[solutionObj.awakeRobots[i]]);
            }
            black_robots_to_draw = black_robots_locations;
        }
        Visualizer.drawRobotLocations(black_robots_to_draw, ctx, scale, true);
        let asleepRobots = Visualizer.getAsleepRobots(solutionObj.problem.robotLocations, solutionObj.awakeRobots);
        if(asleepRobots.length > 0) {
            Visualizer.drawRobotLocations(asleepRobots, ctx, scale, false);
        }
        Visualizer.drawObstacles(solutionObj.problem.obstacles, ctx, scale);
        Visualizer.drawRobotPaths(solutionObj.robotPaths, ctx, scale);
        Visualizer.saveAsFile(filename, canvas);
    }

    static visualizeObstacles(solutionObj, filename) {
        var scale = Visualizer.getScale([], [], solutionObj.problem.obstacles);
        let cv = this.setupCanvas(scale);
        var canvas = cv.canvas; //Hacky due to canvas :(
        var ctx = cv.ctx;
        Visualizer.drawObstacles(solutionObj.problem.obstacles, ctx, scale);
        Visualizer.saveAsFile(filename, canvas);

    }

    static visualizeSolutions(solutions) {
        for (let i = 0; i < solutions.length; i++) {
            this.visualizeSolution(solutions[i], 'problem' + solutions[i].problem.problemNumber);
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
