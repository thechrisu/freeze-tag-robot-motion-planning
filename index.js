/**
 * Created by timbokz on 20/02/17.
 */

"use strict";

const program = require('commander');
const Solver = require('./app/Solver');
const ProblemSet = require('./app/ProblemSet');
const Viz = require('./app/Visualizer');
const ProblemSolutionSynthesizer = require('./app/ProblemSolutionSynthesizer');

const PROBLEM_FILE = './robots.mat';
const PATHS_FILE = 'paths.mat';
const SOLUTION_FILE = './solution.mat';
const MANUAL_FILE = 'solutions/best.mat';

function solveWrapper(isVisualizing, selected, isSolvingAll, isImportingPaths, isExportingPaths) {
    ProblemSet.importFromFile(PROBLEM_FILE, (problems) => {
        let solver = new Solver(problems);
        if(isImportingPaths) {
            ProblemSolutionSynthesizer.pathsSolutionsFromFile(problems, PATHS_FILE, (solutions_dict) => {
                solver = new Solver(problems, solutions_dict);
            });
        }
        if (isSolvingAll) {
            solver.solveAll();
        } else {
            solver.solveSelected(selected);
        }
        if (isVisualizing) {
            let solutions = solver.getSolutions();
            Viz.Visualizer.visualizeSolutions(solutions);
        }
        if (isExportingPaths) {
            let solutions = solver.getSolutions();
            ProblemSolutionSynthesizer.exportPaths(PATHS_FILE, solutions);
        }
        solver.exportToFile(SOLUTION_FILE);
    });
}

function visualizeProblemSolution() {
    ProblemSolutionSynthesizer.hollowSolutionsFromFilePaths(PROBLEM_FILE, MANUAL_FILE, (solutions) => {
        Viz.Visualizer.visualizeSolutions(solutions);
    });
}

function parseProblemArray(rawProblemString) {
    try {
        let asJson = JSON.parse(rawProblemString);
        for (let i = 0; i < asJson.length; i++) {
            if (asJson[i] < 1 || asJson[i] > 30) {
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
        '-v | --visualize for visualizations' +
        '-p | --paths (format specified): Skips the path generation stage for the paths found. Then solves those solutions with paths' +
        '-sp | --save-paths (format specified): Saves paths which it computed solutions for')
    .action(function(mode, options) {
        if(mode == "manual") {
            visualizeProblemSolution();
        } else {
            let selectedProblems = parseProblemArray(mode);
            let isSolvingAll = mode == "all" || !selectedProblems;
            let isVisualizing = process.argv.indexOf("-v") != -1 || process.argv.indexOf("--visualize") != -1;
            let isImportingPaths = process.argv.indexOf("-p") != -1 || process.argv.indexOf("--paths") != -1;
            let isExportingPaths = process.argv.indexOf("-sp") != -1 || process.argv.indexOf("--save-paths") != -1;
            solveWrapper(isVisualizing, selectedProblems, isSolvingAll, isImportingPaths, isExportingPaths);
        }
    });

program.parse(process.argv);

//if