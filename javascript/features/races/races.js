// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import { MockRaceDatabase } from 'features/races/mock_race_database.js';
import { RaceCommands } from 'features/races/race_commands.js';
import { RaceDatabase } from 'features/races/race_database.js';
import { RaceDescription } from 'features/races/race_description.js';
import { RaceGame } from 'features/races/race_game.js';
import { Setting } from 'entities/setting.js';
import { VehicleGameRegistry } from 'features/games_vehicles/vehicle_game_registry.js';

// Directory in which each of the race configuration files have been defined.
const kRaceDirectory = 'data/races/';

// The Races feature is responsible for providing the race interface on the server. It builds on top
// of the Games API, for ensuring consistent behaviour of games on the server.
export default class Races extends Feature {
    commands_ = null;
    database_ = null;
    games_ = null;
    registry_ = null;

    constructor() {
        super();

        // The Races feature depends on the Games Vehicles API for providing its functionality.
        this.games_ = this.defineDependency('games_vehicles');
        this.games_.addReloadObserver(this, () => this.registerGame());

        // The database, in which high scores and checkpoint data will be stored. Will also be used
        // to determine the popularity ranking for games, which the command menu will use.
        this.database_ = server.isTest() ? new MockRaceDatabase()
                                         : new RaceDatabase();

        // The registry is responsible for keeping tabs on the available races.
        this.registry_ = new VehicleGameRegistry('race', kRaceDirectory, RaceDescription);

        // Provides the commands through which players can interact with the race system.
        this.commands_ = new RaceCommands(this.database_, this.games_, this.registry_);

        // Immediately register the RaceGame so that the Games API knows of its existence.
        this.registerGame();
    }

    // ---------------------------------------------------------------------------------------------

    // Registers the RaceGame with the Games API as a game that can be started by players. The entry
    // point will continue to be the "/race" command.
    registerGame() {
        this.games_().registerGame(RaceGame, {
            name: Races.prototype.generateRaceName.bind(this),
            commandFn: Races.prototype.generateRaceCommand.bind(this),
            goal: 'Complete the race track in the shortest possible time.',
            scoreType: 'time',

            minimumPlayers: 1,
            maximumPlayers: 4,
            price: 0,

            settings: [
                // Option: Game Description ID (number)
                new Setting('game', 'description_id', Setting.TYPE_NUMBER, -1, 'Description ID'),
            ],

        }, { database: this.database_, registry: this.registry_ });
    }

    // Generates the command through which a particular race can be started, information which will
    // be conveyed through the |settings| argument. NULL when absent.
    generateRaceCommand(settings) {
        const description = this.registry_.getDescription(settings.get('game/description_id'));
        return description ? `race ${description.id}`
                           : null;
    }

    // Generates the name for the derby described by the given |settings|. It depends on the game's
    // ID that's contained within the |settings|, which should be known to the registry.
    generateRaceName(settings) {
        const description = this.registry_.getDescription(settings.get('game/description_id'));
        return description ? description.name
                           : 'Race';
    }

    // ---------------------------------------------------------------------------------------------
    // The races feature does not define a public API.
    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.games_().removeGame(RaceGame);

        this.games_.removeReloadObserver(this);
        this.games_ = null;

        this.commands_.dispose();
        this.commands_ = null;

        this.registry_.dispose();
        this.registry_ = null;

        this.database_ = null;
    }
}
