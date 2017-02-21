/**
 * Created by c on 20/02/17.
 */

"use strict";

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const ProblemSet = require('../app/ProblemSet');
const Solution = require('../app/Solution');
const CoordinateHelper = require('../app/CoordinateHelper').CoordinateHelper;

class ImportedPath {
    constructor(paths, problemNumber) {
        this.paths = paths;
        this.problemNumber = problemNumber;
    }
}

class ProblemSolutionSynthesizer {

    static fromLine(solutionString) {
        let robotpaths = [];
        let halves = solutionString.split(':');
        let problemNumber = parseInt(halves[0]);
        let robotpathsStringArray = halves[1].split(';');
        for(let i = 0; i < robotpathsStringArray.length; i++) {
            let noWhitespace = robotpathsStringArray[i].replace(/\s/gi, '');
            robotpaths.push(CoordinateHelper.extractPointArray(noWhitespace));
        }
        return {
            problemNumber: problemNumber,
            robotPaths: robotpaths
        };
    }

    static importSolutionSetFromFile(solutionSetPath, callback) {
        var lineReader = readline.createInterface({
            input: fs.createReadStream(path.join(process.cwd(), solutionSetPath)),
        });

        var solutionSets = [];

        var i = 0;
        lineReader.on('line', (line) => {
            if(i >= 2) {
                solutionSets.push(ProblemSolutionSynthesizer.fromLine(line));
            } else {
                i++;
            }
        });
        lineReader.on('close', () => {
            callback(solutionSets);
        });

    }

    static hollowSolutionsFromFilePaths(problemSetPath, solutionSetPath, callback) {
        ProblemSet.importFromFile(problemSetPath, (problems) => {
            ProblemSolutionSynthesizer.importSolutionSetFromFile(solutionSetPath, (solutions) => {
                let real_solutions = [];
                for(let i = 0; i < problems.length; i++) { //problems, solutions length <= 30 so no biggie
                    for(let j = 0; j < solutions.length; j++) { //after all, this is a hackathon
                        if(problems[i].problemNumber == solutions[j].problemNumber) {
                            real_solutions.push(new Solution(problems[i], solutions[j].robotPaths));
                        }
                    }
                }
                callback(real_solutions);
            });
        });
    }

    static pathsSolutionsFromFile(problemSetPath, pathsFilePath, callback) {
        ProblemSet.importFromFile(problemSetPath, (problems) => {
            ProblemSolutionSynthesizer.importPathSetFromFile(pathsFilePath, (paths) => {
                let real_solutions = [];
                for(let i = 0; i < problems.length; i++) { //problems, solutions length <= 30 so no biggie
                    for(let j = 0; j < paths.length; j++) { //after all, this is a hackathon
                        if(problems[i].problemNumber == paths[j].problemNumber) {
                            real_solutions.push(new Solution(problems[i], undefined, paths[j].paths));
                        }
                    }
                }
                callback(real_solutions);
            });
        });
    }

    static getPathsJSON(solution) {
        let ret = {};
        for(let i = 0; i < solution.problem.robotLocations.length; i++) {
            for(let j = 0; j < solution.problem.robotLocations.length; j++) {
                console.log(solution.paths[i][j].toJSON());
                ret[i][j] = solution.paths[i][j].toJSON();
            }
        }
        return JSON.stringify(ret);
    }

    static exportPaths(pathsFilePath, solutions) {
        console.log('exporting paths');
        let output = "";
        for (let i = 0; i < solutions.length; i++) {
            output += solutions[i].problemNumber + ': ' + ProblemSolutionSynthesizer.getPathsJSON(solutions[i]) + '\n';
        }
        fs.writeFileSync(pathsFilePath, output);
    }
}

module.exports = ProblemSolutionSynthesizer;