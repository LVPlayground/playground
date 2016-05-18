// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const RaceCommands = require('features/races/race_commands.js');
const RaceImporter = require('features/races/race_importer.js');
const RaceManager = require('features/races/race_manager.js');

// This class represents the Feature that contains all racing functionality of Las Venturas
// Playground. It also provides the interface for features depending on races.
class Races extends Feature {
    constructor() {
        super();

        // Races depend on the minigame system to provide lifetime management.
        const minigames = this.defineDependency('minigames');

        this.manager_ = new RaceManager(server.database, minigames);
        this.commands_ = new RaceCommands(this.manager_);

        // TODO(Russell): Import races using a glob() rather than manually.
        [
            'data/races/desert_race.json',
            'data/races/dirty_race.json',
            'data/races/easy_race.json',
            'data/races/hard_race.json',
            'data/races/mountain_valleyside.json',
            'data/races/normal_race.json',
            'data/races/quad_race.json',
            'data/races/stunters_xpress.json',

        ].forEach(file => this.manager_.registerRace(RaceImporter.fromFile(file)));

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
