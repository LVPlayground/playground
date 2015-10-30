// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Race = require('features/races/race.js'),
    Vector = require('base/vector.js');

// Private symbol to prevent people from using the RaceImporter's constructor.
let constructorSymbol = Symbol('Required for constructing the RaceImporter.');

// Minimum and maximum time limits of a race. Limits less than 30 seconds don't make sense, whereas
// limits more than 20 minutes also don't make sense (you don't have to impose a limit!).
const MIN_TIME_LIMIT = 30;
const MAX_TIME_LIMIT = 1200;

// Coordinate boundary limits applied to all coordinates specified for races.
const MIN_COORDINATE = -20000.0;
const MAX_COORDINATE = 20000.0;

// Default diameter of a race checkpoint, in game units.
const DEFAULT_CHECKPOINT_SIZE = 20.0;

// Minimum and maximum size of race checkpoints. These are not technical limits, but sensible limits
// since anything outside this range would be rediculous.
const MIN_SIZE = 5.0;
const MAX_SIZE = 50.0;

// Maximum number of laps for a race. This is a sensibility limitation as well.
const MAX_LAPS = 25;

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

    // Process the optional fields.
    this.importTimeLimit();
    this.importLaps();
    this.importChallengeDesk();
    this.importEnvironment();
    this.importSettings();
  }

  // Imports the name of the race. It must be a non-zero-length string.
  importName() {
    if (!this.data_.hasOwnProperty('name'))
      throw new Error('The `name` property of a race must be defined.');

    if (typeof this.data_.name !== 'string' || this.data_.name.length == 0)
      throw new Error('The `name` property of a race must contain a non-zero-length string.');

    this.race_.name = this.data_.name;
  }

  // Imports the time limit of this race. It must be in range of [MIN_TIME_LIMIT, MAX_TIME_LIMIT].
  importTimeLimit() {
    if (!this.data_.hasOwnProperty('time_limit'))
      return;  // this field is optional.

    let timeLimit = this.data_.time_limit;
    if (typeof timeLimit !== 'number' || timeLimit < MIN_TIME_LIMIT || timeLimit > MAX_TIME_LIMIT)
      throw new Error('The `time_limit` must be in the range [' + MIN_TIME_LIMIT + ', ' + MAX_TIME_LIMIT + '].');

    this.race_.timeLimit = timeLimit;
  }

  // Imports the number of laps of a race. It must be an integer larger than zero.
  importLaps() {
    if (!this.data_.hasOwnProperty('laps'))
      return;  // this field is optional

    if (typeof this.data_.laps !== 'number')
      throw new Error('The number of `laps` of a race must be a number.');

    if (this.data_.laps < 1 || this.data_.laps > MAX_LAPS)
      throw new Error('The number of `laps` of a race must be in range of [1, ' + MAX_LAPS + '].');

    this.race_.laps = this.data_.laps;
  }

  // Imports the challenge desk location. An actor will be spawned at this location with the given
  // model, with a checkpoint just in front of them through which the player can start a challenge
  // to perform the race by themselves.
  importChallengeDesk() {
    if (!this.data_.hasOwnProperty('challenge_desk'))
      return;  // this field is optional.

    if (typeof this.data_.challenge_desk !== 'object' || Array.isArray(this.data_.challenge_desk))
      throw new Error('The `challenge_desk` for a race must be an object.')

    let challengeDesk = this.data_.challenge_desk;
    if (!challengeDesk.hasOwnProperty('actor_model') || !challengeDesk.hasOwnProperty('position') ||
        !challengeDesk.hasOwnProperty('rotation'))
      throw new Error('The `challenge_desk` must have an `actor_model`, `position` and `rotation`.');

    // TODO: Validate the model id of the actor that's being used.
    let actorModel = challengeDesk.actor_model;
    if (typeof actorModel !== 'number')
      throw new Error('The `actor_model` for the challenge desk must be a valid model.');

    let position = createVector(challengeDesk.position),
        rotation = createRotation(challengeDesk.rotation);

    this.race_.challengeDesk = { actorModel, position, rotation };
  }

  // Imports the environmental settings for this race. Among them are the weather, time and interior
  // in which the time should take place.
  importEnvironment() {
    if (!this.data_.hasOwnProperty('environment'))
      return;  // this field is optional.

    if (typeof this.data_.environment !== 'object' || Array.isArray(this.data_.environment))
      throw new Error('The environmental data for a race must be an object.');

    let environment = this.data_.environment;
    if (environment.hasOwnProperty('weather')) {
      if (typeof environment.weather !== 'number')
        throw new Error('The weather type must be a number.');

      this.race_.weather = environment.weather;
    }

    if (environment.hasOwnProperty('time')) {
      if (!Array.isArray(environment.time) || environment.time.length < 2)
        throw new Error('The time of a race must be an array having [hour, minutes].');

      this.race_.time = [environment.time[0], environment.time[1]];
    }

    if (environment.hasOwnProperty('interior')) {
      // TODO: Verify that these limits for the interior numbers make sense.
      if (typeof environment.interior !== 'number' || environment.interior < 0 || environment.interior > 13)
        throw new Error('The interior id of a race must be in the range of [0, 13].');

      this.race_.interior = environment.interior;
    }
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

  // Imports the misc settings that may apply to a race. These finetune the presentation of the race
  // to players, or may affect behavior, for example the kind of checkpoint that's being used.
  importSettings() {
    if (!this.data_.hasOwnProperty('settings'))
      return;  // this field is optional.

    if (typeof this.data_.settings !== 'object' || Array.isArray(this.data_.settings))
      throw new Error('The settings for a race must be an object.');

    let settings = this.data_.settings;
    if (settings.hasOwnProperty('use_airplane_checkpoints'))
      this.race_.useAirplaneCheckpoints = !!settings.use_airplane_checkpoints;
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
