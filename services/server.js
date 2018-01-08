const express = require("express");
const app = express();
const cors = require("cors");
const querying = require("./querying.js");
const quakes = require("./quakes.js");

app.use(cors());

const port = 80;
let grids = {};

const addGrid = (id, grid) => {
  grids[id] = grid;
};

app.get("/cells/population", (req, res) => {
  console.log(
    req.route.path +
      " pinged with GET " +
      JSON.stringify(req.query) +
      " query string"
  );
  let grid = grids[req.query.id];

  if (grid != null) {
    res.type("json");
    res.status(200).send(grid.getWrappedCells("population"));
  } else {
    res.status(404).send("Grid does not exist");
  }
});

app.get("/cells/property", (req, res) => {
  console.log(
    req.route.path +
      " pinged with GET " +
      JSON.stringify(req.query) +
      " query string"
  );
  let grid = grids[req.query.id];

  if (grid != null) {
    res.type("json");
    res.status(200).send(grid.getWrappedCells("property"));
  } else {
    res.status(404).send("Grid does not exist");
  }
});

app.get("/cells", (req, res) => {
  console.log(
    req.route.path +
      " pinged with GET " +
      JSON.stringify(req.query) +
      " query string"
  );
  let grid = grids[req.query.id];

  if (grid != null) {
    res.type("json");
    res.status(200).send(grid.getWrappedCells());
  } else {
    res.status(404).send("Grid does not exist");
  }
});

app.get("/grid", (req, res) => {
  console.log(
    req.route.path +
      " pinged with GET " +
      JSON.stringify(req.query) +
      " query string"
  );
  let grid = grids[req.query.id];

  if (grid != null) {
    res.type("json");
    res.status(200).send(grid.getSelfWrapped());
  } else {
    res.status(404).send("Grid does not exist");
  }
});

app.post("/quake", (req, res) => {
  console.log(
    req.route.path +
      " pinged with POST " +
      JSON.stringify(req.query) +
      " query string"
  );

  let quake = quakes[req.query.quakeId];
  let grid = grids[req.query.id];
  console.log(quake,grid);

  if (quake != null && grid != null) {
    try {
      grid.quake(quake.where, quake.magnitude);
      res.status(200).send("Success!");
    } catch (err) {
      console.log(err);
      res.status(500).send("Quake probably didn not occur");
    }
  } else {
    res.status(500).send("Quake probably didn not occur");
  }
});

app.post("/change", (req, res) => {
  console.log(
    req.route.path +
      " pinged with POST " +
      JSON.stringify(req.query) +
      " query string"
  );

  let property = req.query.property;
  let grid = grids[req.query.id];
  console.log(grid[property]);

  if (grid != null && grid[property] != null && !isNaN(req.query.value)) {
    try {
      grid.changeProperty(property, req.query.value);
      res.status(200).send(property + ": " + req.query.value);
    } catch (err) {
      console.log(err);
      res.status(500).send("Property change probably didn not occur");
    }
  } else {
    res.status(500).send("Property change probably didn not occur");
  }
});

app.listen(port, () => {
  console.log("App listening on port " + port);
});

module.exports = addGrid;
