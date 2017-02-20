/**
 * Created by timbokz on 20/02/17.
 */

"use strict";

const ProblemSet = require('./app/ProblemSet');
const Solver = require('./app/Solver');

ProblemSet.importFromFile('./robots.mat', (problems) => {
    let solver = new Solver(problems);
    solver.solveAll();
    solver.exportToFile('./solutions.mat');
});
