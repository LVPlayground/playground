// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import RaceCommands from 'features/races/race_commands.js';
import RaceImporter from 'features/races/race_importer.js';
import RaceManager from 'features/races/race_manager.js';

// In which directory are the race data files stored?
const RACE_DATA_DIRECTORY = 'data/races';

// This class represents the Feature that contains all racing functionality of Las Venturas
// Playground. It also provides the interface for features depending on races.
class Races extends Feature {
    constructor() {
        super();

        // This feature hasn't been designed to handle changing interactions with the Minigames. It
        // is possible to update this, but it'd be a fair amount of work.
        this.disableLiveReload();

        // Races depend on the minigame system to provide lifetime management.
        const minigames = this.defineDependency('minigames');

        this.manager_ = new RaceManager(server.database, minigames);
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

export default Races;
