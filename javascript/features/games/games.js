// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';
import { GameCommands } from 'features/games/game_commands.js';
import { GameDescription } from 'features/games/game_description.js';
import { GameManager } from 'features/games/game_manager.js';
import { GameRegistry } from 'features/games/game_registry.js';

// Base interface upon which minigames can be built. Provides the ability for players to start a
// free game or challenge particular other players to a game, keep track of the players in the game
// and consider it finished when either everyone leaves, or the game signals that there's a winner.
export default class Games extends Feature {
    commands_ = null;
    manager_ = null;
    registry_ = null;

    constructor() {
        super();

        // Participating in a game costs some money, but can also reward a prize.
        const finance = this.defineDependency('finance');

        // The Nuwani framework allows us to broadcast participation and results to other places.
        const nuwani = this.defineDependency('nuwani');

        // Various aspects of the games framework are configurable through `/lvp settings`.
        const settings = this.defineDependency('settings');

        // The game manager keeps track of all active games on the server, regardless of how they
        // have been started. Expects to be instrumented by other components.
        this.manager_ = new GameManager(finance, nuwani);

        // The game registry keeps track of all the games that are available on the server. It will
        // further make sure that the commands for these games are available as appropriate.
        this.registry_ = new GameRegistry(this.manager_);
        
        // Implements the commands with which players can start and stop games.
        this.commands_ = new GameCommands(finance, nuwani, settings, this.manager_, this.registry_);
    }

    // ---------------------------------------------------------------------------------------------

    // Registers the given |gameConstructor|, which will power the game declaratively defined in the
    // |options| dictionary. An overview of the available |options| is available in README.md.
    registerGame(gameConstructor, options) {
        this.registry_.registerGame(new GameDescription(gameConstructor, options));
    }

    // Removes the game previously registered with |gameConstructor| from the list of games that
    // are available on the server. In-progress games will be stopped immediately.
    removeGame(gameConstructor) {
        this.registry_.removeGame(gameConstructor);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.commands_.dispose();
        this.commands_ = null;

        this.registry_.dispose();
        this.registry_ = null;

        this.manager_.dispose();
        this.manager_ = null;
    }
}
