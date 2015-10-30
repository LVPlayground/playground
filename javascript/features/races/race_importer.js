// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Race = require('features/races/race.js'),
    Vector = require('base/vector.js');

// Private symbol to prevent people from using the RaceImporter's constructor.
let constructorSymbol = Symbol('Required for constructing the RaceImporter.');

// Coordinate boundary limits applied to all coordinates specified for races.
const MIN_COORDINATE = -20000.0;
const MAX_COORDINATE = 20000.0;

// Default diameter of a race checkpoint, in game units.
const DEFAULT_CHECKPOINT_SIZE = 20.0;

// Minimum and maximum size of race checkpoints. These are not technical limits, but sensible limits
// since anything outside this range would be rediculous.
const MIN_SIZE = 5.0;
const MAX_SIZE = 50.0;

// Provides functionality to process a JSON file containing race information and create a new Race
// instance out of it. Errors will lead to exceptions, so it's adviced to import all known races
// while beginning to initialize the gamemode.
//
// Each race must have a defined name, at least a single spawning position and
//
// Races can contain any number of spawn positions, each of which must exist of a set of coordinates
// and the position's rotation and information of the used vehicle, having at least a model, but
// optionally also the vehicle's colors and NOS.
//
// Races need to have one or more checkpoints. There is no limit to the amount of checkpoints that
// can be added to a game. Each checkpoint must have a position, and optionally also a defined size
// in case it differs from the default (20.0).
//
class RaceImporter {
  constructor(privateSymbol, data) {
    if (privateSymbol != constructorSymbol)
      throw new Error('Please do not construct the RaceImporter, use RaceImporter.fromFile().');

    this.data_ = data;
    this.race_ = new Race();
  }

  // Loads the contents of |filename| as JSON and uses it to construct a new Race instance based on
  // it. Strict verification of the provided data will be done, failures will be considered fatal.
  static fromFile(filename) {
    let data = JSON.parse(readFile(filename));
    if (typeof data !== 'object')
      throw new Error('Unable to import race data from file: ' + filename);

    let importer = new RaceImporter(constructorSymbol, data);
    if (importer.process())
      return importer.race;

    return null;
  }

  // Constructs a new Race object from |data|. Should generally only be used by tests. Will not
  // process the import, instead, will return an unprocessed RaceImporter instance.
  static fromDataForTests(data) {
    return new RaceImporter(constructorSymbol, data);
  }

  // Returns the constructed Race instance. Should only be used when the import succeeded.
  get race() { return this.race_; }

  // Processes the |data_| and imports it in |race_|, providing all verification passes. Returns
  // TRUE when the data has successfully been imported in the race.
  process() {
    // Process the required fields.
    this.importName();
    this.importSpawnPositions();
    this.importCheckpoints();

  }

  // Imports the name of the race. It must be a non-zero-length string.
  importName() {
    if (!this.data_.hasOwnProperty('name'))
      throw new Error('The `name` property of a race must be defined.');

    if (typeof this.data_.name !== 'string' || this.data_.name.length == 0)
      throw new Error('The `name` property of a race must contain a non-zero-length string.');

    this.race_.name = this.data_.name;
  }

  // Imports the spawn positions for the race. There must be at least a single spawn position that
  // exists of positional coordinates, rotation of the vehicle and the vehicle's model id.
  importSpawnPositions() {
    if (!Array.isArray(this.data_.spawn_positions) || this.data_.spawn_positions.length == 0)
      throw new Error('At least a single entry must be defined in the `spawn_positions` array.');

    this.data_.spawn_positions.forEach(spawnPosition => {
      if (typeof spawnPosition !== 'object')
        throw new Error('Every `spawn_position` for a race must be an object.');

      if (!spawnPosition.hasOwnProperty('position') || !spawnPosition.hasOwnProperty('rotation'))
        throw new Error('Every `spawn_position` must specify a position and a rotation.');

      let position = this.createVector(spawnPosition.position);
      let rotation = this.createRotation(spawnPosition.rotation);

      if (!spawnPosition.hasOwnProperty('vehicle') || typeof spawnPosition.vehicle !== 'object')
        throw new Error('Every `spawn_position` must specify the vehicle to use, as an object.');

      let vehicleData = spawnPosition.vehicle;
      let vehicle = {
        model: null,
        colors: [-1, -1],
        nos: 0
      };

      // TODO: Validate the vehicle model id that is to be used for the race.
      if (!vehicleData.hasOwnProperty('model') || typeof vehicleData.model !== 'number')
        throw new Error('Every `spawn_position` must specify the vehicle\'s model id.');

      vehicle.model = vehicleData.model;

      // Import the vehicle's colors. When specifieid, it must be an array having two numbers.
      if (vehicleData.hasOwnProperty('colors')) {
        if (!Array.isArray(vehicleData.colors) || vehicleData.colors.length < 2 ||
            typeof vehicleData.colors[0] !== 'number' || typeof vehicleData.colors[1] != 'number') {
          throw new Error('The `colors` of a `spawn_position` vehicle\'s must be an array with two numbers.');
        }

        vehicle.colors = [ vehicleData.colors[0], vehicleData.colors[1] ];
      }

      // Import the vehicle's NOS. When specified, it must be a number of value [1, 5, 10].
      if (vehicleData.hasOwnProperty('nos')) {
        if (typeof vehicleData.nos !== 'number' || ![0, 1, 5, 10].includes(vehicleData.nos))
          throw new Error('The `nos` of a `spawn_position` must be one of [0, 1, 5, 10].');

        vehicle.nos = vehicleData.nos;
      }

      this.race_.addSpawnPosition(position, rotation, vehicle);
    });
  }

  // Imports the checkpoints associated with a race. Each checkpoint must have a vectorial position,
  // and optionally a defined size (diameter) in range of [MIN_SIZE, MAX_SIZE].
  importCheckpoints() {
    if (!Array.isArray(this.data_.checkpoints) || this.data_.checkpoints.length == 0)
      throw new Error('At least a single entry must be defined in the `checkpoints` array.');

    this.data_.checkpoints.forEach(checkpoint => {
      if (typeof checkpoint !== 'object')
        throw new Error('Every `checkpoint` for a race must be an object.');

      if (!checkpoint.hasOwnProperty('property'))
        throw new Error('Each checkpoint must have a defined `position`.');

      let position = this.createVector(checkpoint.position);

      let size = DEFAULT_CHECKPOINT_SIZE;
      if (checkpoint.hasOwnProperty('size')) {
        if (typeof checkpoint.size !== 'number' || checkpoint.size < MIN_SIZE || checkpoint.size > MAX_SIZE)
          throw new Error('The `size` of a checkpoint must be in range of [' + MIN_SIZE + ', ' + MAX_SIZE + '].');

        size = checkpoint.size;
      }

      this.race_.addCheckpoint(position, size);
    });
  }

  // Creates a vector from |value| having {x, y, z} coordinates, each of which must be numbers.
  createVector(value) {
    if (!Array.isArray(value) || value.length != 3)
      throw new Error('Vectors must be defined as arrays having three values: [x, y, z].');

    value.forEach(coordinate => {
      if (typeof coordinate !== 'number' || coordinate < MIN_COORDINATE || coordinate > MAX_COORDINATE)
        throw new Error('Race coordinates must be numbers in range of [' + MIN_COORDINATE + ', ' + MAX_COORDINATE + '].');
    });

    return new Vector(value[0], value[1], value[2]);
  }

  // Create a rotation from |value|. It must be a number in the range of [0, 360].
  createRotation(value) {
    if (typeof value !== 'number' || value < 0 || value > 360)
      throw new Error('Rotations must be numbers in the range of [0, 360].');

    return value;
  }
};
