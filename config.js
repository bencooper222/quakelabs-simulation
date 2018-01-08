//@ts-check
// This config is not for secrets.
// It's to set up the simulation how you would like to.
// I haven't quite decided how to handle this vis-à-vis .gitignore
const Grid = require("./services/grid.js");
const querying = require("./services/querying.js");
const rnorm = require("randgen").rnorm;
const Promise = require("bluebird");
let exp = module.exports;

exp.tick = {};

exp.tick.realFrequency = 10; // seconds
exp.tick.fakeFrequency = 1080; // seconds
exp.tick.limit = 560;
// this works out to 56 minutes representing 7 days

exp.dimensions = {
  x: 13,
  y: 12
};
exp.population = {};
exp.population.value = 1000000; // approximate
exp.population.cellPopulationPercentVariance = 0.11; // multiplied by each cell's average population to create actual variance
exp.population.growthPerTickMean = 1.00001;
exp.population.growthPerTickVariance = 0.000009; // this might seem really low but you have to remember that this is going to be put to the power of 365/3

exp.population.distribution = function(grid) {
  // this function will evenly distribute the populace to the best of its ability.
  // the cells with the lowest x scores and then (if x is equal) y scores will tend to have more population because division isn't perfect
  let totalCells = grid.xSize * grid.ySize;
  let minCellPopulation = Math.floor(exp.population.value / totalCells);
  let remainder = exp.population - minCellPopulation;

  for (let x = 0; x < grid.xSize; x++) {
    for (let y = 0; y < grid.ySize; y++) {
      let populationToAddCurrent =
        minCellPopulation + (remainder-- > 0 ? 1 : 0);
      let toChange = grid.at(x, y);
      toChange.changePopulation(
        rnorm(
          populationToAddCurrent,
          populationToAddCurrent * exp.population.cellPopulationPercentVariance
        )
      );
      toChange.changePopulationGrowth(
        rnorm(
          exp.population.growthPerTickMean,
          exp.population.growthPerTickVariance
        )
      );
    }
  }
};

exp.population.setResilience = function(grid){
  let vals = new Array(new Array());
 


  for (let x = 0; x < grid.xSize; x++) {
    for (let y = 0; y < grid.ySize; y++) {
      grid.at(x,y).changePopResilience(rnorm(40,8));
    }
  }
}

exp.property = {};

exp.property.value = exp.population.value * 4234; // 4234 is average value/capita
exp.property.cellPropertyPercentVariance = 0.18; // multiplied by each cell's average population to create actual variance

exp.property.distribution = function(grid) {
  // this function will evenly distribute propery value
  let totalCells = grid.xSize * grid.ySize;
  let cellValue = exp.property.value / totalCells;

  for (let x = 0; x < grid.xSize; x++) {
    for (let y = 0; y < grid.ySize; y++) {
      grid
        .at(x, y)
        .changePropertyOriginalValue(
          rnorm(cellValue, exp.property.cellPropertyPercentVariance * cellValue)
        );
    }
  }
};

exp.quake = {};
exp.quake.baseDamage = 32.459;
exp.quake.exponentScaler = 0.0677;

exp.misc = {};

exp.misc.serverValueRounding = 4; // round values exposed by API to x decimals. Set to false for no rounding.
exp.misc.noRound = ["population.growthPerTick"]; // don't round these because accuracy is needed
exp.setup = function(grid) {
  return new Promise(resolve => {
    let rtn = grid || new Grid(exp.dimensions.x, exp.dimensions.y);
    exp.population.distribution(rtn);
    exp.property.distribution(rtn);
    exp.population.setResilience(rtn)

    resolve(rtn);
  });
};
