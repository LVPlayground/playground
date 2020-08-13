// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Feature } from 'components/feature_manager/feature.js';
import { DerbyCommands } from 'features/derbies/derby_commands.js';
import { DerbyDescription } from 'features/derbies/derby_description.js';
import { DerbyGame } from 'features/derbies/derby_game.js';
import { Setting } from 'entities/setting.js';
import { VehicleGameRegistry } from 'features/games_vehicles/vehicle_game_registry.js';

// Directory in which each of the derby configuration files have been defined.
const kDerbyDirectory = 'data/derbies/';

// The Derbies feature is responsible for providing the derbies interface on the server. It builds
// on top of the Games API, for ensuring consistent behaviour of games on the server.
export default class Derbies extends Feature {
    commands_ = null;
    games_ = null;
    registry_ = null;

    constructor() {
        super();

        // It's possible for players to become invisible while playing a derby.
        this.defineDependency('player_colors');

        // The Derby feature depends on the Games API for providing its functionality.
        this.games_ = this.defineDependency('games');
        this.games_.addReloadObserver(this, () => this.registerGame());

        // The registry is responsible for keeping tabs on the available derbies.
        this.registry_ = new VehicleGameRegistry('derby', kDerbyDirectory, DerbyDescription);

        // Provides the commands through which players can interact with the race system.
        this.commands_ = new DerbyCommands(this.games_, this.registry_);

        // Immediately register the DerbyGame so that the Games API knows of its existence.
        this.registerGame();
    }

    // ---------------------------------------------------------------------------------------------

    // Registers the DerbyGame with the Games API as a game that can be started by players. The
    // entry point for derbies will still be the "/derby" command manually provided.
    registerGame() {
        this.games_().registerGame(DerbyGame, {
            name: 'Derby',  // TODO: have a name generator
            goal: 'Be the last person standing in a vehicle war.',

            minimumPlayers: 1,
            maximumPlayers: 4,
            price: 0,

            settings: [
                // Option: Game Description ID (number)
                new Setting('game', 'description_id', Setting.TYPE_NUMBER, -1, 'Description ID'),
            ],

        }, this.registry_);
    }

    // ---------------------------------------------------------------------------------------------
    // The derbies feature does not define a public API.
    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.games_().removeGame(DerbyGame);

        this.games_.removeReloadObserver(this);
        this.games_ = null;

        this.commands_.dispose();
        this.commands_ = null;

        this.registry_.dispose();
        this.registry_ = null;
    }
}
