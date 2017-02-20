/**
 * Created by c on 20/02/17.
 */

"use strict";

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const ProblemSet = require('../app/ProblemSet');
const Solution = require('../app/Solution');
const CoordinateHelper = require('../app/CoordinateHelper');

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

    static fromPaths(problemSetPath, solutionSetPath, callback) {
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
}

module.exports = ProblemSolutionSynthesizer;