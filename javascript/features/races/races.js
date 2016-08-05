// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const RaceCommands = require('features/races/race_commands.js');
const RaceImporter = require('features/races/race_importer.js');
const RaceManager = require('features/races/race_manager.js');

// In which directory are the race data files stored?
const RACE_DATA_DIRECTORY = 'data/races';

// This class represents the Feature that contains all racing functionality of Las Venturas
// Playground. It also provides the interface for features depending on races.
class Races extends Feature {
    constructor() {
        super();

        // Races depend on the minigame system to provide lifetime management.
        const minigames = this.defineDependency('minigames');

        // Races report checkpoint and final result times of participating players to logstash.
        const logger = this.defineDependency('logger', true /* isFunctional */);

        this.manager_ = new RaceManager(server.database, minigames, logger);
        this.commands_ = new RaceCommands(this.manager_);

        // Load all the races from the /data/races/ directory. No need to specify them individually.
        glob(RACE_DATA_DIRECTORY, '.*\.json').forEach(file =>
            this.manager_.registerRace(RaceImporter.fromFile(RACE_DATA_DIRECTORY + '/' + file)));

        // Load the best times for all races from the database.
        this.manager_.loadRecordTimes();
    }

    // ---------------------------------------------------------------------------------------------
    // The races feature does not define a public API.
    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.commands_.dispose();
        this.manager_.dispose();
    }
}

exports = Races;
