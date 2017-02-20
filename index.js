/**
 * Created by timbokz on 20/02/17.
 */

"use strict";

const program = require('commander');
const ProblemSet = require('./app/ProblemSet');
const Solver = require('./app/Solver');
const Viz = require('./app/Visualizer');

function solveWrapper(isVisualizing, selected, isSolvingAll) {
    ProblemSet.importFromFile('./robots.mat', (problems) => {
        let solver = new Solver(problems);
        console.log(selected);
        if(isSolvingAll) {
            solver.solveAll();
        } else {
            solver.solveSelected(selected);
        }
        if(isVisualizing) {
            let solutions = solver.getSolutions();
            Viz.Visualizer.visualizeSolutions(solutions);
        }
        solver.exportToFile('./solutions.mat');
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
    .description('Our solutions')
    .option("-v, --visualize", "Whether to visualize the problems after solving them")
    .action(function(mode, options) {
        let isSolvingAll = mode == "all";
        let isVisualizing = process.argv.indexOf("-v") != -1 || process.argv.indexOf("--visualize") != -1;
        let selectedProblems = parseProblemArray(mode);
        if(!isSolvingAll && !selectedProblems) {
            console.error("Please provide valid problem numbers");
        }
        solveWrapper(isVisualizing, selectedProblems, isSolvingAll);
    });

program.parse(process.argv);

//if