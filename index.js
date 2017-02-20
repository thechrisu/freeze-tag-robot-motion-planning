/**
 * Created by timbokz on 20/02/17.
 */

"use strict";

const ProblemSet = require('./app/ProblemSet');
const Solver = require('./app/Solver');
const Viz = require('./app/Visualizer');

ProblemSet.importFromFile('./robots.mat', (problems) => {
    let solver = new Solver(problems);
    solver.solveAll();
    let solutions = solver.getSolutions();
    Viz.Visualizer.visualizeSolutions(solutions);
    solver.exportToFile('./solutions.mat');
});
