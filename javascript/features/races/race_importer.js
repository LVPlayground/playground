// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Race from 'features/races/race.js';
import RaceCheckpoint from 'components/checkpoints/race_checkpoint.js';

// Private symbol to prevent people from using the RaceImporter's constructor.
const PrivateSymbol = Symbol('Required for constructing the RaceImporter.');

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

// Maximum number of unique object models that may be used in a single race. Too many objects will
// cause instability for the players attempting to play a race.
const MAX_OBJECT_MODELS = 100;

// Provides functionality to process a JSON file containing race information and create a new Race
// instance out of it. Errors will lead to exceptions, so it's adviced to import all known races
// while beginning to initialize the gamemode.
//
// Each race must have a defined name, at least a single spawning position and a checkpoint. Races
// my be played by any number of players - even individual players.
//
// Races can contain any number of spawn positions, each of which must exist of a set of coordinates
// and the position's rotation and information of the used vehicle, having at least a model, but
// optionally also the vehicle's colors and NOS.
//
// Races need to have one or more checkpoints. There is no limit to the amount of checkpoints that
// can be added to a game. Each checkpoint must have a position, and optionally also a defined size
// in case it differs from the default (20.0).
//
// A race can also have a challenge desk, which will create an actor in the normal world together
// with a checkpoint.
//
// Finally, there are lots of smaller settings and options available for races. Please see the wiki
// page for the races system for full documentation on the system's abilities.
class RaceImporter {
    // Loads the contents of |filename| as JSON and uses it to construct a new Race instance based
    // on it. Strict verification of the provided data will be done.
    static fromFile(filename) {
        const data = JSON.parse(readFile(filename));
        if (typeof data !== 'object')
            throw new Error('Unable to import race data from file: ' + filename);

        let importer = new RaceImporter(PrivateSymbol, data);
        importer.process();

        return importer.race;
    }

    // Constructs a new Race object from |data|. Should generally only be used by tests. Will not
    // process the import, instead, will return an unprocessed RaceImporter instance.
    static fromDataForTests(data) {
        return new RaceImporter(PrivateSymbol, data);
    }

    constructor(privateSymbol, data) {
        if (privateSymbol != PrivateSymbol)
            throw new TypeError('Illegal constructor. Use the static methods instead.');

        this.data_ = data;
        this.race_ = new Race();

        this.useAirplaneCheckpoints_ = false;
        this.disableCheckpointMarkers_ = false;
    }

    // Returns the constructed Race instance. Should only be used when the import succeeded.
    get race() { return this.race_; }

    // Processes the |data_| and imports it in |race_|, providing all verification passes. An
    // exception will be thrown if not all data can be imported to the race.
    process() {
        // Process the settings. These may influence the rest of the importing process.
        this.importSettings();
        this.importLaps();

        // Process the required fields.
        this.importId();
        this.importName();
        this.importSpawnPositions();
        this.importCheckpoints();

        // Process the optional fields.
        this.importTimeLimit();
        this.importChallengeDesk();
        this.importEnvironment();
        this.importObjects();

        // Make sure that this race doesn't have too many objects.
        if (this.race_.objectModelCount > MAX_OBJECT_MODELS)
            throw new Error('Races may not exceed ' + MAX_OBJECT_MODELS + ' unique object models.');
    }

    // Imports the id of this race. It must be a non-zero integer.
    importId() {
        if (!this.data_.hasOwnProperty('id'))
            throw new Error('The `id` property of a race must be defined.');

        if (typeof this.data_.id !== 'number' || this.data_.id < 1)
            throw new Error('The `id` property of a race must be a number larger than zero.');

        this.race_.id = this.data_.id;
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
        if (typeof timeLimit !== 'number' || timeLimit < MIN_TIME_LIMIT ||
            timeLimit > MAX_TIME_LIMIT) {
            throw new Error('The `time_limit` must be in the range [' + MIN_TIME_LIMIT +
                            ', ' + MAX_TIME_LIMIT + '].');
        }

        this.race_.timeLimit = timeLimit;
    }

    // Imports the number of laps of a race. It must be an integer larger than zero.
    importLaps() {
        if (!this.data_.hasOwnProperty('laps'))
            return;  // this field is optional

        if (typeof this.data_.laps !== 'number')
            throw new Error('The number of `laps` of a race must be a number.');

        if (this.data_.laps < 1 || this.data_.laps > MAX_LAPS) {
            throw new Error(
                'The number of `laps` of a race must be in range of [1, ' + MAX_LAPS + '].');
        }

        this.race_.laps = this.data_.laps;
    }

    // Imports the challenge desk location. An actor will be spawned at this location with the given
    // model, with a checkpoint just in front of them through which the player can start a challenge
    // to perform the race by themselves.
    importChallengeDesk() {
        if (!this.data_.hasOwnProperty('challenge_desk'))
            return;  // this field is optional.

        if (typeof this.data_.challenge_desk != 'object' ||Array.isArray(this.data_.challenge_desk))
            throw new Error('The `challenge_desk` for a race must be an object.')

        const challengeDesk = this.data_.challenge_desk;
        if (!challengeDesk.hasOwnProperty('actor_model') ||
            !challengeDesk.hasOwnProperty('position') ||
            !challengeDesk.hasOwnProperty('rotation')) {
            throw new Error('The challenge_desk must have an actor_model, position and rotation.');
        }

        // TODO: Validate the model id of the actor that's being used.
        const actorModel = challengeDesk.actor_model;
        if (typeof actorModel !== 'number')
            throw new Error('The `actor_model` for the challenge desk must be a valid model.');

        const position = this.createVector(challengeDesk.position);
        const rotation = this.createRotation(challengeDesk.rotation);

        this.race_.challengeDesk = { actorModel, position, rotation };
    }

    // Imports the environmental settings for this race. Among them are the weather, time and
    // interior in which the time should take place.
    importEnvironment() {
        if (!this.data_.hasOwnProperty('environment'))
            return;  // this field is optional.

        if (typeof this.data_.environment !== 'object' || Array.isArray(this.data_.environment))
            throw new Error('The environmental data for a race must be an object.');

        const environment = this.data_.environment;
        if (environment.hasOwnProperty('weather')) {
            if (typeof environment.weather !== 'number')
                throw new Error('The weather type must be a number.');

            this.race_.weather = environment.weather;
        }

        if (environment.hasOwnProperty('time')) {
            if (!Array.isArray(environment.time) || environment.time.length < 2)
                throw new Error('The time of a race must be an array having [hour, minutes].');

            this.race_.time = [ environment.time[0], environment.time[1] ];
        }

        if (environment.hasOwnProperty('interior')) {
            // TODO: Verify that these limits for the interior numbers make sense.
            if (typeof environment.interior !== 'number' || environment.interior < 0 ||
                environment.interior > 13) {
                throw new Error('The interior id of a race must be in the range of [0, 13].');
            }

            this.race_.interior = environment.interior;
        }
    }

    // Imports the spawn positions for the race. There must be at least a single spawn position that
    // exists of positional coordinates, rotation of the vehicle and the vehicle's model id.
    importSpawnPositions() {
        if (!Array.isArray(this.data_.spawn_positions) || this.data_.spawn_positions.length == 0)
            throw new Error('At least a single entry must be defined in the `spawn_positions`.');

        this.data_.spawn_positions.forEach(spawnPosition => {
            if (typeof spawnPosition !== 'object')
                throw new Error('Every `spawn_position` for a race must be an object.');

            if (!spawnPosition.hasOwnProperty('position') ||
                !spawnPosition.hasOwnProperty('rotation')) {
                throw new Error('Every `spawn_position` must specify a position and a rotation.');
            }

            const position = this.createVector(spawnPosition.position);
            const rotation = this.createRotation(spawnPosition.rotation);

            if (!spawnPosition.hasOwnProperty('vehicle') ||
                typeof spawnPosition.vehicle !== 'object') {
                throw new Error('Every `spawn_position` must be specified as an object.');
            }

            const vehicleData = spawnPosition.vehicle;
            const vehicle = {
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
                    typeof vehicleData.colors[0] !== 'number' ||
                    typeof vehicleData.colors[1] != 'number') {
                    throw new Error('The `colors` of a `spawn_position` vehicle\'s an array.');
                }

                vehicle.colors = [ vehicleData.colors[0], vehicleData.colors[1] ];
            }

            // Import the vehicle's NOS. When specified, it must be a number of value [1, 5, 10].
            if (vehicleData.hasOwnProperty('nos')) {
                if (typeof vehicleData.nos !== 'number' || ![0, 1, 5, 10].includes(vehicleData.nos))
                    throw new Error('The `nos` of a spawn_position must be one of [0, 1, 5, 10].');

                vehicle.nos = vehicleData.nos;
            }

            this.race_.addSpawnPosition(position, rotation, vehicle);
        });
    }

    // Imports the checkpoints associated with a race. Each checkpoint must have a vectorial,
    // position and optionally a defined size (diameter) in range of [MIN_SIZE, MAX_SIZE].
    importCheckpoints() {
        if (!Array.isArray(this.data_.checkpoints) || this.data_.checkpoints.length == 0)
            throw new Error('At least a single entry must be defined in the `checkpoints` array.');

        let checkpoints = [];
        this.data_.checkpoints.forEach(checkpoint => {
            if (typeof checkpoint !== 'object')
                throw new Error('Every `checkpoint` for a race must be an object.');

            if (!checkpoint.hasOwnProperty('position'))
                throw new Error('Each checkpoint must have a defined `position`.');

            const position = this.createVector(checkpoint.position);

            let size = DEFAULT_CHECKPOINT_SIZE;
            if (checkpoint.hasOwnProperty('size')) {
                if (typeof checkpoint.size !== 'number' || checkpoint.size < MIN_SIZE ||
                    checkpoint.size > MAX_SIZE) {
                    throw new Error('The `size` of a checkpoint must be in range of [' +
                                    MIN_SIZE + ', ' + MAX_SIZE + '].');
                }

                size = checkpoint.size;
            }

            checkpoints.push({ position, size });
        });

        const lapCheckpointCount = checkpoints.length;
        const totalCheckpointCount = lapCheckpointCount * this.race_.laps;

        for (let checkpointId = 0; checkpointId < totalCheckpointCount; ++checkpointId) {
            const isFinalCheckpoint = checkpointId == totalCheckpointCount - 1;
            const checkpoint = checkpoints[checkpointId % lapCheckpointCount];

            let type = null;
            if (this.disableCheckpointMarkers_) {
                type = RaceCheckpoint.NO_MARKER;
            } else if (this.useAirplaneCheckpoints_) {
                type = isFinalCheckpoint ? RaceCheckpoint.AIRBORNE_FINISH
                                         : RaceCheckpoint.AIRBORNE_NORMAL;
            } else {
                type = isFinalCheckpoint ? RaceCheckpoint.GROUND_FINISH
                                         : RaceCheckpoint.GROUND_NORMAL;
            }

            const nextPosition =
                isFinalCheckpoint ? null
                                  : checkpoints[(checkpointId + 1) % lapCheckpointCount].position;

            // Create the new RaceCheckpoint instance, and and add it to the race.
            this.race_.addCheckpoint(
                new RaceCheckpoint(type, checkpoint.position, nextPosition, checkpoint.size));
        }
    }

    // Imports the objects associated with this race. Each entry must be an object with three:
    // entries model (an integer) and position and rotation, both of which are 3D vectors.
    importObjects() {
        if (!this.data_.hasOwnProperty('objects'))
            return;  // this field is optional.

        if (!Array.isArray(this.data_.objects))
            throw new Error('The `objects` associated with a race must be an array.');

        this.data_.objects.forEach(object => {
            if (typeof object !== 'object' || Array.isArray(object))
                throw new Error('Each object associated with a race must be an object.');

            if (!object.hasOwnProperty('model') || !object.hasOwnProperty('position') ||
                !object.hasOwnProperty('rotation')) {
                throw new Error('Each object must have a `model`, `position` and `rotation`.');
            }

            // TODO: Validate the model id of the object.
            if (typeof object.model !== 'number')
                throw new Error('The model id for an object must be a number.');

            this.race_.addObject(object.model,
                                 this.createVector(object.position),
                                 this.createVector(object.rotation));
        });
    }

    // Imports the misc settings that may apply to a race. These finetune the presentation of the
    // race to players, or may affect behavior, for example the kind of checkpoint being used.
    importSettings() {
        if (!this.data_.hasOwnProperty('settings'))
            return;  // this field is optional.

        if (typeof this.data_.settings !== 'object' || Array.isArray(this.data_.settings))
            throw new Error('The settings for a race must be an object.');

        const settings = this.data_.settings;
        if (settings.hasOwnProperty('use_airplane_checkpoints'))
            this.useAirplaneCheckpoints_ = !!settings.use_airplane_checkpoints;

        if (settings.hasOwnProperty('disable_checkpoint_markers'))
            this.disableCheckpointMarkers_ = !!settings.disable_checkpoint_markers;

        if (settings.hasOwnProperty('disable_vehicle_damage'))
            this.race_.disableVehicleDamage = !!settings.disable_vehicle_damage;

        if (settings.hasOwnProperty('allow_leave_vehicle'))
            this.race_.allowLeaveVehicle = !!settings.allow_leave_vehicle;

        if (settings.hasOwnProperty('unlimited_nos'))
            this.race_.unlimitedNos = !!settings.unlimited_nos;
    }

    // Creates a vector from |value| having {x, y, z} coordinates, each of which must be numbers.
    createVector(value) {
        if (!Array.isArray(value) || value.length != 3)
            throw new Error('Vectors must be defined as arrays having three values: [x, y, z].');

        value.forEach(coordinate => {
            if (typeof coordinate !== 'number' || coordinate < MIN_COORDINATE ||
                coordinate > MAX_COORDINATE) {
                throw new Error('Race coordinates must be numbers in range of [' +
                                MIN_COORDINATE + ', ' + MAX_COORDINATE + '].');
            }
        });

        return new Vector(value[0], value[1], value[2]);
    }

    // Create a rotation from |value|. It must be a number in the range of [0, 360].
    createRotation(value) {
        if (typeof value !== 'number' || value < 0 || value > 360)
            throw new Error('Rotations must be numbers in the range of [0, 360].');

        return value;
    }
}

export default RaceImporter;
