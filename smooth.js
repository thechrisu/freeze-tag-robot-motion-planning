"use strict";

const fs = require('fs');
//const Solution = require('./app/Solution');
const path = require('path');
const readline = require('readline');
const PF = require('pathfinding');
const CoordinateHelper = require('./app/CoordinateHelper').CoordinateHelper;
const Point = require('./app/CoordinateHelper').Point;
const PathGenerator = require('./app/PathGenerator').PathGenerator;
const ProblemSolutionSynthesizer = require('./app/ProblemSolutionSynthesizer');

const PROBLEM_FILE = './robots.mat';
const SOLUTION_FILE = './solutions.mat';
const OUTPUT_FILE = './compressed_solutions.mat';

const GROUP_NAME = 'inugami';
const GROUP_PASS = 'pfsorqi9qp0cq1971l3la66vdl';

/*
importFromFile() {
    var lineReader = readline.createInterface({
        input: fs.createReadStream(path.join(process.cwd(), SOLUTION_FILE)),
    });

    var solutionLines = [];

    lineReader.on('line', (line) => processLine(solutionLines, line));
    lineReader.on('close', () => {
        callback(solutionLines);
    });
}

processLine(solutionLines, line) {
    let solutionPaths;

    let data = line.replace(/\d+: /gi, '');
    let parts = data.split(';');
    
    solutionPaths = parts;

    solutionLines.push(new Problem(robotLocations, obstacles, currentProblemNumber));
    currentProblemNumber++;
}*/

/**
 * @deprecated
 * @param path
 * @returns {Array}
 */
function pathToArray(path, pg) {
    let ret = [];
    for(let i = 0; i < path.length; i++) {
        let scp = pg.scalePointToProblem(path[i]);
        ret.push([Math.round(scp.x), Math.round(scp.y)]);
    }
    return ret;
}

/**
 * @deprecated
 * @param pointArray
 * @returns {Array}
 */
function arrayToPath(pointArray) {
    let ret = [];
    for(let i = 0; i < pointArray.length; i++) {
        ret.push(new Point(pointArray[i][0], pointArray[i][1]));
    }
    return ret;
}

ProblemSolutionSynthesizer.hollowSolutionsFromFilePaths(PROBLEM_FILE, SOLUTION_FILE, (solutions) => {
	//more code here
	for(let i = 0; i < solutions.length; i++){ 
		let solution = solutions[i];
        let pg = new PathGenerator(solution.problem);
		let matrix = pg.generateGridMatrix(solution.problem.obstacles);
        let grid = new PF.Grid(matrix);
        for(let j = 0; j < solution.robotPaths.length; j++) {
        	let path = pathToArray(solution.robotPaths[j], pg);
            let pathLength = path.length;
            if(path.length > 0) {
                path = PF.Util.compressPath(path);
                console.log('compressed!');
            	path = PF.Util.smoothenPath(grid, path);
                console.log('smoothened!');
                solution.robotPaths[j] = pg.convertPathToOriginalScalePoints(path);
            }
            console.log('done ' + (j+1) + ' of ' + solution.robotPaths.length
                + ' paths. Reduced from ' + pathLength + ' to ' + path.length);
    	}
	}

    let output = [GROUP_NAME, GROUP_PASS, ''].join('\n');
    for (let i = 0; i < solutions.length; i++) {
        output += solutions[i].problem.problemNumber + ': ' + solutions[i].toString() + '\n';
    }
    fs.writeFileSync(OUTPUT_FILE, output);
});
