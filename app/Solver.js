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
     * @param solutions_with_skipped_first_part_dict
     */
    constructor(problems, solutions_with_skipped_first_part_dict) {
        this.problems = problems;
        this.solvedSolutions = [];
        if(solutions_with_skipped_first_part_dict) {
            this.solutions_with_skipped_first_part_dict = solutions_with_skipped_first_part_dict;
        }
        this.isSavingIntermediate = false;
    }

    solveConcurrently(solution) {
        /*
         solution.print(); //you're gonna thank me later for that
         solution.save();
         this.solvedSolutions.push(solution);
         */
    }

    solveAll() {
        for (let i = 0; i < this.problems.length; i++) {
            this.solve(i);
        }
    }

    solveSelected(problemNumberArray) {
        for (let i = 0; i < problemNumberArray.length; i++) {
            let problemIndex = problemNumberArray[i] - 1;
            this.solve(problemIndex);
        }
    }

    solve(problemIndex) {
        console.log('Problem: ' + (problemIndex + 1));
        try {
            let solution = undefined;
            if(this.solutions_with_skipped_first_part_dict) {

                solution = this.solutions_with_skipped_first_part_dict[problemIndex + 1]; //we store problem num
            } else {
                solution = new Solution(this.problems[problemIndex]);
            }
            solution.solve();
            this.solvedSolutions.push(solution.getCompressedSolution());
            if(this.isSavingIntermediate) {
                solution.save();
            }
        } catch (e) {
            console.error(e);
            console.error(e.stack);
        } finally {
            console.log('Problem done: ' + (problemIndex + 1));
        }
    }

    getSolutions() {
        return this.solvedSolutions;
    }

    setSavingIntermediate(isSavingIntermediate) {
        this.isSavingIntermediate = isSavingIntermediate;
    }

    /**
     * @param {string} filePath
     */
    exportToFile(filePath) {
        let output = [GROUP_NAME, GROUP_PASS, ''].join('\n');
        for (let i = 0; i < this.solvedSolutions.length; i++) {
            output += this.solvedSolutions[i].problem.problemNumber + ': ' + this.solvedSolutions[i].toString() + '\n';
        }
        fs.writeFileSync(filePath, output);
    }

}

module.exports = Solver;
