/**
 * Created by timbokz on 20/02/17.
 */

const ProblemSet = require('./app/ProblemSet');

ProblemSet.importFromFile('./robots.mat', (problemSets) => {
    console.log(problemSets[2].obstacles)
});
