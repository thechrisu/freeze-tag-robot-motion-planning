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
const Point = require('./CoordinateHelper').Point;
const Path = require('../app/PathGenerator').Path;

class ProblemSolutionSynthesizer {

    static solutionFromLine(solutionString) {
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

    static pathFromLine(pathLine) {
        let numStr = "";
        let i;
        for(i = 0; i < pathLine.length && pathLine[i] != ':'; i++) {
            numStr += pathLine[i];
        }
        let ret = {};
        ret.problemNumber = parseInt(numStr);
        ret.actualPath = {};
        let raw_path = JSON.parse(pathLine.substr(i + 1, pathLine.length));
        for(let robotNum_o in raw_path) {
            ret.actualPath[robotNum_o] = {};
            for(let robotNum_d in raw_path[robotNum_o]) {
                let raw_elem = raw_path[robotNum_o][robotNum_d];
                ret.actualPath[robotNum_o][robotNum_d] = {
                    cost: raw_elem.cost,
                    startRobot: raw_elem.startRobot,
                    endRobot: raw_elem.endRobot,
                    points: []
                };
                let new_elem = ret.actualPath[robotNum_o][robotNum_d];
                let pts = raw_elem.points;
                for(let i = 0; i < pts.length; i++) {
                    try {
                        new_elem.points.push(new Point(pts[i].x, pts[i].y));
                    } catch (e) {
                        console.log(pts, i);
                        throw "ILLEGAL: POINT IS EMPTY. SOMETHING WRONG WITH IMPORTING PATHS FILE";
                    }
                }
                ret.actualPath[robotNum_o][robotNum_d] =
                    new Path(new_elem.points, new_elem.cost, new_elem.startRobot, new_elem.endRobot);
            }
        }
        return ret;
    }

    static importSolutionSetFromFile(solutionSetPath, callback) {
        var lineReader = readline.createInterface({
            input: fs.createReadStream(path.join(process.cwd(), solutionSetPath)),
        });

        var solutionSets = [];

        var i = 0;
        lineReader.on('line', (line) => {
            if(i >= 2) {
                solutionSets.push(ProblemSolutionSynthesizer.solutionFromLine(line));
            } else {
                i++;
            }
        });
        lineReader.on('close', () => {
            callback(solutionSets);
        });
    }

    static importPathSetFromFile(pathsFilePath, callback) {
        var lineReader = readline.createInterface({
            input: fs.createReadStream(path.join(process.cwd(), pathsFilePath)),
        });
        var pathDict = {};
        lineReader.on('line', (line) => {
            let r = ProblemSolutionSynthesizer.pathFromLine(line);
            pathDict[r.problemNumber] = r.actualPath;
        });
        lineReader.on('close', () => {
            callback(pathDict);
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

    static pathsSolutionsFromFile(problems, pathsFilePath, callback) {
        ProblemSolutionSynthesizer.importPathSetFromFile(pathsFilePath, (paths) => {
            let real_solutions = {};
            for(let i = 0; i < problems.length; i++) { //problems, solutions length <= 30 so no biggie
                let prob_num = problems[i].problemNumber;
                let prob_nums = Object.keys(paths);
                if(JSON.stringify(prob_num) in prob_nums) {
                    real_solutions[prob_num] = new Solution(problems[i], undefined, paths[prob_num]);
                }
            }
            callback(real_solutions);
        });
    }

    static getPathsJSON(solution) {
        let ret = {};
        for(let i = 0; i < solution.problem.robotLocations.length; i++) {
            ret[i] = {};
            for(let j = 0; j < solution.problem.robotLocations.length; j++) {
                ret[i][j] = solution.paths[i][j].toJson();
            }
        }
        return JSON.stringify(ret);
    }

    static exportPaths(pathsFilePath, solutions) {
        console.log('exporting paths');
        let output = "";
        for (let i = 0; i < solutions.length; i++) {
            output += solutions[i].problem.problemNumber + ': ' + ProblemSolutionSynthesizer.getPathsJSON(solutions[i]) + '\n';
        }
        fs.writeFileSync(pathsFilePath, output);
    }
}

module.exports = ProblemSolutionSynthesizer;