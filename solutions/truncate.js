/**
 * Created by euql1n on 23/02/17.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const FILE = path.join(__dirname, 'best.mat');

let lineReader = readline.createInterface({
    input: fs.createReadStream(FILE),
});

let lines = [];

lineReader.on('line', (line) => {
    line = line.replace(/\s/gi, '');
    let parts = line.split(':');
    let paths = parts[1].split(';';
    for (let i = 0; i < paths.length; i++) {
        let points = paths[i].replace(/(^\(|\)$)/gi, '').split('),(');
        let pathString = '(';
        let pointCount = points.length;
        for(let k = 0; k < pointCount; k++) {
            if(k != 0) pathString += '),(';
            let numbers = points[k].split(',');
            let x = parseFloat(numbers[0]);
            let y = parseFloat(numbers[1]);
            if(pointCount > 3 && k == 1) {
                x = parseFloat(x.toFixed(8));
                y = parseFloat(y.toFixed(8));
            }
            pathString += x + ',' + y;
        }
        paths[i] = pathString;
    }
    lines.push(parts[0] + ':' + paths.join(';'));
});
lineReader.on('close', () => {
    fs.writeFile(FILE, lines.join('\n'));
});