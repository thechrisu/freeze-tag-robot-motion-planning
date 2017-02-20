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
        this.solvedSolutions = [];
    }

    solveAll() {
        for (let i = 0; i < this.problems.length; i++) {
            let solution = new Solution(this.problems[i]);
            solution.solve();
            this.solvedSolutions.push(solution);
        }
    }

    getSolutions() {
        return this.solvedSolutions;
    }

    /**
     * @param {string} filePath
     */
    exportToFile(filePath) {
        let output = [GROUP_NAME, GROUP_PASS, ''].join('\n');
        for (let i = 0; i < this.solvedSolutions.length; i++) {
            output += (i + 1) + ': ' + this.solvedSolutions[i].toString() + '\n';
        }
        fs.writeFileSync(filePath, output);
    }

}

module.exports = Solver;
