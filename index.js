/**
 * Created by timbokz on 20/02/17.
 */

"use strict";

const program = require('commander');
const Solver = require('./app/Solver');
const ProblemSet = require('./app/ProblemSet');
const Viz = require('./app/Visualizer');
const ProblemSolutionSynthesizer = require('./app/ProblemSolutionSynthesizer');

function solveWrapper(isVisualizing, selected, isSolvingAll) {
    ProblemSet.importFromFile('./robots.mat', (problems) => {
        let solver = new Solver(problems);
        if(isSolvingAll) {
            solver.solveAll();
        } else {
            solver.solveSelected(selected);
        }
        if(isVisualizing) {
            let solutions = solver.getSolutions();
            Viz.Visualizer.visualizeSolutions(solutions);
        }
        solver.exportToFile('./solution.mat');
    });
}

function visualizeProblemSolution() {
    ProblemSolutionSynthesizer.fromPaths('./robots.mat', 'solutions/bruteforce.mat', (solutions) => {
        Viz.Visualizer.visualizeSolutions(solutions);
    });
}

function parseProblemArray(rawProblemString) {
    try {
        let asJson = JSON.parse(rawProblemString);
        for(let i = 0; i < asJson.length; i++) {
            if(asJson[i] < 1 || asJson[i] > 30) {
                console.error("Invalid problem number(s) entered");
            }
        }
        return asJson;
    } catch (e) {
        return undefined;
    }
}

program.command('*')
    .usage("[mode]")
    .description('Our solutions. Sorry for the crappy docstring here. all | [1,2,17] for solving all/selected problems. ' +
        '-v | --visualize for visualizations')
    .option("-v, --visualize", "Whether to visualize the problems after solving them")
    .action(function(mode, options) {
        if(mode == "manual") {
            visualizeProblemSolution();
        } else {
            let selectedProblems = parseProblemArray(mode);
            let isSolvingAll = mode == "all" || !selectedProblems;
            let isVisualizing = process.argv.indexOf("-v") != -1 || process.argv.indexOf("--visualize") != -1;
            solveWrapper(isVisualizing, selectedProblems, isSolvingAll);
        }
    });

program.parse(process.argv);

//if