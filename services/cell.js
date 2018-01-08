//@ts-check

const Promise = require("bluebird");
const rnorm = require('randgen').rnorm;
// the cells that composes the Grid
function Cell(x, y, grid, options = {}) {
  this.x = x;
  this.y = y;
  this.grid = grid; // you are absolutely FORBIDDEN from altering this. http://jasonjl.me/blog/2014/10/15/javascript/

  this.population = {};
  try {
    this.population.originalValue = options.population.val || 0;
    this.population.growthPerTick = options.population.tickGrowth || 1; // multiplier
    this.population.dead = options.population.dead || 0;

    this.population.resiliency = options.population.resilience;
  } catch (err) {}

  this.property = {};
  try {
    this.property.originalValue = options.property.val || 0;
    this.property.destroyed = options.property.destroyed || 0;
    this.property.poi = options.property.poi || {};
    this.property.resiliency = options.property.resilience; // a 1-100 rating of how earthquake resistant the local infrastructure is. 0 means everything is destroyed
  } catch (err) {}
}

// takes you where you need to go!
Cell.prototype.navigate = function(where) {
  where = where.toLowerCase(); // ez parse
  let options = {
    n: [0, 1],
    e: [1, 0],
    s: [0, -1],
    w: [-1, 0],
    ne: [1, 1],
    se: [1, -1],
    sw: [-1, -1],
    nw: [-1, 1],
    none: [0, 0]
  };

  if (Object.keys(options).includes(where) === false)
    // TODO: add toLowerCase parsing
    throw new Error("Invalid location passed to navigate funciton");

  let target = [this.x + options[where][0], this.y + options[where][1]];
  if (target[0] < 0 || target[1] < 0) {
    throw new Error("Negative grid location not permitted.");
  }

  if (target[0] > this.grid.xSize - 1 || target[1] > this.grid.ySize - 1) {
    throw new Error("Location out of grid bounds in positive direction.");
  }

  return this.grid.at(target[0], target[1]);
};

Cell.prototype.changePopulation = function(newPopulation) {
  this.population.originalValue = newPopulation;
};

Cell.prototype.changePopResilience = function(newResilience){
  this.population.resiliency = newResilience;
}

Cell.prototype.changePopulationGrowth = function(newGrowth) {
  this.population.growthPerTick = newGrowth;
};

Cell.prototype.changePropertyOriginalValue = function(newValue) {
  this.property.originalValue = newValue;
};

Cell.prototype.tick = function(growthPerTickAlterationValue) {
  console.log(growthPerTickAlterationValue,this.population.growthPerTick);
  this.population.growthPerTick *=
    growthPerTickAlterationValue * Math.pow(this.population.resiliency/1.1, 0.25);
    if(this.population.growthPerTick>1.02){
      this.population.growthPerTick = rnorm(.99,.13)
    }

    if(this.population.growthPerTick<.6){
      this.population.growthPerTick = rnorm(rnorm(.72,.1),.13)
    }
  this.population.originalValue *= this.population.growthPerTick; // grow! (or die...)
};

// percent is percentage of full quake this cell will experience
Cell.prototype.quake = function(
  magnitude,
  baseDamage,
  exponentScaler,
  percent = 100
) {
  // currently property optimized, not for loss of life
 /*
  this.population.growthPerTick *=
    this.population.originalValue /
    (this.population.originalValue + this.population.dead); // adjust growth to population
*/
  this.doPopulationDamage(
    magnitude - Math.log10(1 / percent), // magnitude is logarithmically scaled
    baseDamage,
    exponentScaler
  )// property damage
};

function doPropertyDamage(magnitude, baseDamage, exponentScaler) {
  // be careful with the formula values here - they're important!
  // personally I recommend baseDamage = 32.459 and exponentScaler = .0677
  // those tend to lead to decent scaling. Experiment here: https://www.desmos.com/calculator/yhpsge2l7r
  let damageRating = Math.pow(10, magnitude) * this.property.resiliency / 100;
  let percentDamage = baseDamage * Math.pow(damageRating, exponentScaler);

  this.property.destroyed = this.property.value * percentDamage / 100;
  this.property.originalValue -= this.propert.destroyed;
}

Cell.prototype.doPopulationDamage = function(magnitude, baseDamage, exponentScaler) {
  //console.log(this);
  let damageRating = Math.pow(10, magnitude) * this.population.resiliency / 100;
  let percentDeath = baseDamage * Math.pow(damageRating, exponentScaler);

  this.population.dead = this.population.value * percentDeath / 100;
  this.population.originalValue -= this.population.dead;
}
module.exports = Cell;
