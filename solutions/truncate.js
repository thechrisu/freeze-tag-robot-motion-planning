/**
 * Created by euql1n on 23/02/17.
 */

"use strict";

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const FILE = path.join(__dirname, 'best.mat');
const OUT = path.join(__dirname, 'truncated.mat');

let lineReader = readline.createInterface({
    input: fs.createReadStream(FILE),
});

let lines = [];

let ignoreQuestions = [
    // 4,
    // 7,
    // 11,
    // 12,
    // 13,
    // 15,
    // // All
    // 18,
    // 19,
    // 20,
    // 21,
    // 22,
    // 23,
    // 25,
    // 26,
    // 27,
    // 28,
    // 29,
    // 30,
];

lineReader.on('line', (line) => {
    if (!line.match(/^\d+: /)) {
        lines.push(line);
        return;
    }
    line = line.replace(/\s/gi, '');
    let parts = line.split(':');
    let parseQuestion = ignoreQuestions.indexOf(parseInt(parts[0])) === -1;
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
            if (parseQuestion && pointCount > 6 && k !== 0 && k % 5 === 0) {
                x = parseFloat(x.toFixed(9));
                y = parseFloat(y.toFixed(9));
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
});