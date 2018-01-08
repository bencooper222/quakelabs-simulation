// @ts-check
const Promise = require("bluebird");
const Cell = require("./cell.js");
const CellWrapper = require("./wrappers/cell.js");
const GridWrapper = require("./wrappers/grid.js");
const config = require("../config.js");
const querying = require("./querying.js");
const rnorm = require('randgen').rnorm;

// a grid represents the city - a combination of cells

function Grid(xSize, ySize) {
  this.xSize = xSize; // will always
  this.ySize = ySize;
  // console.log(this.xSize,this.ySize);
  this.realTime = 0; // seconds
  this.fakeTime = 0; // seconds
  this._cells = createCells.call(this); // call() ensures that it has the right "this"
  //console.log(this.cells);

  this.food = 15;
  this.water =15;
  this.shelter = 15;
  this.wellness = 15;
}

// function to move grid simulation forward. Defaults to 1 tick forward but can do a different number if needed
// probably won't be deterministic so _be_ careful.
Grid.prototype.tick = function(num = 1) {
  //console.log(this);
  this.realTime += config.tick.realFrequency;
  this.fakeTime += config.tick.fakeFrequency;
  this._cells.forEach(row => {
    row.forEach(cell => {
      let alterationValue =
        (this.food + this.water + this.shelter + this.wellness) / 4 / 100;
      cell.tick(alterationValue);
    });
  });
};

Grid.prototype.quake = function(
  where,
  magnitude,
  baseDamage = config.quake.baseDamage,
  exponentScaler = config.quake.exponentScaler
) {
  Object.keys(where).forEach(percent => {
    where[percent].forEach(location => {
      this.at(location[0], location[1]).quake(
        magnitude,
        baseDamage,
        exponentScaler,
        percent // percent of quake this locale will experience
      );
    });
  });
};

Grid.prototype.changeProperty = function(property,newVal){
  
    this[property] = newVal;
  
  
}

// you could directly access with Grid._cells but this has error protection
Grid.prototype.at = function(x, y, direction = "none") {
  if (x < 0 || x > this.xSize - 1) {
    throw new Error("x out of bounds");
  }

  if (y < 0 || y > this.ySize - 1) {
    throw new Error("y out of bounds");
  }

  let rtn = this._cells[x][y];

  if (rtn == null) {
    this._cells[x][y] = new Cell(x, y, this);
    rtn = this._cells[x][y];
  }

  return direction === "none" ? rtn : rtn.direction;
};

// returns cells without grid reference
// type is "population" or "property" - if unspecified, returns both
Grid.prototype.getWrappedCells = function(type) {
  let cells = new Array(this.xSize);
  //console.log(this.xSize,this.ySize);
  for (let x = 0; x < this.xSize; x++) {
    cells[x] = new Array(this.ySize);
    for (let y = 0; y < this.ySize; y++) {
      //console.log(x,y,cells[x][y]);
      //console.log(x,y);
      let current = this.at(x, y);

      if (type === "population") {
        cells[x][y] = CellWrapper.population(current);
      } else if (type === "property") {
        cells[x][y] = CellWrapper.property(current);
      } else {
        cells[x][y] = CellWrapper.both(current);
      }
    }
  }
  // console.log(cells);
  return cells;
};

Grid.prototype.getSelfWrapped = function() {
  return GridWrapper(this);
};

// moving x percent of people from toMove to newLocale
Grid.prototype.evacuate = function(toMoveQuery, newLocaleQuery, percent) {
  let evacueeCells = querying.rectangular(this, toMoveQuery[0], toMoveQuery[1]);
  let newLocaleCells = querying.rectangular(
    this,
    newLocaleQuery[0],
    newLocaleQuery[1]
  );

  let totalToMove = 0;
  evacueeCells.forEach(element => {
    let toRemove = element.population.originalValue * percent / 100;
    totalToMove += toRemove;
    element.population.originalValue -= toRemove;
  });

  newLocaleCells.forEach(element => {
    element.population.originalValue += totalToMove / newLocaleCells.length;
  });
};

Grid.prototype.totalPopulation = function() {
  let total = 0;
  this._cells.forEach(row => {
    row.forEach(cell => {
      total += cell.population.originalValue;
    });
  });
  return total;
};

// makes the cells
const createCells = function() {
  let cells = new Array(this.xSize);
  //console.log(this.xSize,this.ySize);
  for (let x = 0; x < this.xSize; x++) {
    cells[x] = new Array(this.ySize);
    for (let y = 0; y < this.ySize; y++) {
      //console.log(x,y,cells[x][y]);
      //console.log(x,y);
      cells[x][y] = new Cell(x, y, this);
    }
  }
  // console.log(cells);
  return cells;
};

module.exports = Grid;
