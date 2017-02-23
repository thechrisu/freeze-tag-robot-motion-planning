/**
 * Created by euql1n on 23/02/17.
 */

"use strict";

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const ProblemSet = require('../app/ProblemSet');

const FILE = path.join(__dirname, 'best.mat');
const OUT = path.join(__dirname, 'truncated.mat');


let ignoreQuestions = [
    // 1,
    // 2,
    // 3,
    // 4,
    // 5,
    // // 6,
    // 7,
    // 8,
    // 9,
    // // 10,
    // 11,
    // 12,
    // 13,
    // // 14,
    // // 15,
    // // 16,
    // 17,
    // 18,
    // // 19,
    // 20,
    // 21,
    // // 22,
    // 23,
    // 25,
    // 26,
    // 27,
    // 28,
    // 29,
    // 30,
];


ProblemSet.importFromFile('robots.mat', (problems) => {


    let problemRobotCount = 0;
    let robotCount = 0;
    let isRobot = (problemNumber, x, y) => {
        let problemIndex = problemNumber - 1;
        let locationCount = problems[problemIndex].robotLocations.length;
        let cutoff = 0.00000001;
        for (let i = 0; i < locationCount; i++) {
            let xDiff = Math.abs(problems[problemIndex].robotLocations[i].x - x);
            let yDiff = Math.abs(problems[problemIndex].robotLocations[i].y - y);
            if (xDiff < cutoff && yDiff < cutoff) {
                robotCount++;
                return true;
            }
        }
        return false;
    };

    let lines = [];
    let lineReader = readline.createInterface({
        input: fs.createReadStream(FILE),
    });
    lineReader.on('line', (line) => {
        if (!line.match(/^\d+:/)) {
            lines.push(line);
            return;
        }
        line = line.replace(/\s/gi, '');
        let parts = line.split(':');
        let problemNumber = parseInt(parts[0]);
        problemRobotCount += problems[problemNumber].robotLocations.length;
        let parseQuestion = ignoreQuestions.indexOf(problemNumber) === -1;
        let paths = parts[1].split(';');
        for (let i = 0; i < paths.length; i++) {
            let points = paths[i].replace(/(^\(|\)$)/gi, '').split('),(');
            let pathString = '(';
            let pointCount = points.length;
            for (let k = 0; k < pointCount; k++) {
                if (k != 0) pathString += '),(';
                let numbers = points[k].split(',');
                let x = parseFloat(numbers[0]);
                let y = parseFloat(numbers[1]);
                if (!isRobot(problemNumber, x, y) && parseQuestion) {
                    x = parseFloat(x.toFixed(12));
                    y = parseFloat(y.toFixed(12));
                }
                pathString += x + ',' + y;
            }
            pathString += ')';
            paths[i] = pathString;
        }
        lines.push(parts[0] + ':' + paths.join(';'));
    });
    lineReader.on('close', () => {
        fs.writeFile(OUT, lines.join('\n'));
        setTimeout(() => console.log('Size', fs.statSync(OUT).size / 1000.0), 10);
        console.log('Robots', robotCount, problemRobotCount);
    });

});