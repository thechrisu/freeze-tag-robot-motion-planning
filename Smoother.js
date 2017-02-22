"use strict"

const fs = require('fs');
const Solution = require('./Solution');
const path = require('path');
const readline = require('readline');
const PF = require('pathfinding');
const CoordinateHelper = require('./app/CoordinateHelper').CoordinateHelper;
const PathGenerator = require('./app/PathGenerator').PathGenerator;

const PROBLEM_FILE = './robots.mat';
const SOLUTION_FILE = './solutions.mat';
const OUTPUT_FILE = './compressed_solutions.mat';

const GROUP_NAME = 'inugami';
const GROUP_PASS = 'pfsorqi9qp0cq1971l3la66vdl';

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
}

ProblemSolutionSynthesizer.hollowSolutionsFromFilePaths(PROBLEM_FILE, SOLUTION_FILE, (solutions) => {
	//more code here
	for(let i = 0; i < solutions.length; i++){ 
		let solution = solutions[i];
		let matrix = (new PathGenerator(solution.problem)).generateGridMatrix(solution.problem.obstacles);
        let grid = new PF.Grid(matrix);
        for(let j = 0; j < solution.robotPaths.length; j++) {
        	let path = solution.robotPaths[j];
            if(path.length > 0) {
            	solution.robotPaths[j] = PF.Util.smoothenPath(grid, path);
            }
    	}
	}

    let output = [GROUP_NAME, GROUP_PASS, ''].join('\n');
    for (let i = 0; i < solutions.length; i++) {
        output += solutions[i].problem.problemNumber + ': ' + solutions[i].toString() + '\n';
    }
    fs.writeFileSync(OUTPUT_FILE, output);
});
