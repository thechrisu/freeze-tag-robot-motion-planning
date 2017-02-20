/**
 * @author Timur Kuzhagaliyev <tim.kuzh@gmail.com>
 * @copyright 2017
 * @license MIT
 */

"use strict";

const fs = require('fs');
const Solution = require('./Solution');

const GROUP_NAME = 'inugami';
const GROUP_PASS = 'pfsorqi9qp0cq1971l3la66vdl';

class Solver {

    /**
     * @param {Problem[]} problems
     */
    constructor(problems) {
        this.problems = problems;
        this.solutionStrings = [];
    }

    solveAll() {
        for (let i = 0; i < this.problems.length; i++) {
            let solution = new Solution(this.problems[i]);
            solution.solve();
            this.solutionStrings.push(solution.toString());
        }
    }

    /**
     * @param {string} filePath
     */
    exportToFile(filePath) {
        let output = [GROUP_NAME, GROUP_PASS, ''].join('\n');
        for (let i = 0; i < this.solutionStrings.length; i++) {
            output += (i + 1) + ': ' + this.solutionStrings[i] + '\n';
        }
        fs.writeFileSync(filePath, output);
    }

}

module.exports = Solver;
