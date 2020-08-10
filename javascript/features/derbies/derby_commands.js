// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';
import { DerbyGame } from 'features/derbies/derby_game.js';
import { EnvironmentSettings } from 'features/games/environment_settings.js';
import { GameCommandParams } from 'features/games/game_command_params.js';
import { Menu } from 'components/menu/menu.js';

// Provides the "/derby" command for players to interact with, which allows them to start or
// spectate one of the in-progress derbies. Builds on top of the Games API.
export class DerbyCommands {
    #games_ = null;
    #registry_ = null;

    constructor(games, registry) {
        this.#games_ = games;
        this.#registry_ = registry;

        // /derby [watch/[id]]?
        server.commandManager.buildCommand('derby')
            .description(`Compete in one of Las Venturas Playground's derbies.`)
            .sub(CommandBuilder.kTypeNumber, 'id')
                .description(`Compete in a specific derby, identified by ID.`)
                .build(DerbyCommands.prototype.onDerbyStartCommand.bind(this))
            .sub('watch')
                .description(`Spectate one of the on-going derbies.`)
                .build(DerbyCommands.prototype.onDerbyWatchCommand.bind(this))
            .build(DerbyCommands.prototype.onDerbyCommand.bind(this));
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the `/derby` command is executed without specifying a particular derby.
    async onDerbyCommand(player) {
        const dialog = new Menu('Derbies');

        // Populate the |dialog| with each of the available derbies from the registry.
        for (const description of this.#registry_.derbies()) {
            const name = description.name;
            const listener =
                DerbyCommands.prototype.onDerbyStartCommand.bind(this, player, description.id);

            dialog.addItem(name, listener);
        }

        // Display the |dialog| to the |player|, and we're done.
        await dialog.displayForPlayer(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| wants to start the derby identified by |derbyId|. Will defer to the
    // Games API, where limits checks and player availability will be executed.
    async onDerbyStartCommand(player, derbyId) {
        const description = this.#registry_.getDerby(derbyId);
        if (!description) {
            player.sendMessage(Message.DERBIES_ERROR_INVALID_ID);
            return;
        }

        const params = new GameCommandParams();
        params.settings.set('derbies/derby_id', description.id);
        params.type = GameCommandParams.kTypeStart;

        // Apply the game's environment settings as defaults for this derby.
        EnvironmentSettings.applyDescriptionSettings(params.settings, description);

        return this.#games_().executeGameCommand(DerbyGame, player, params);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| wants to spectate one of the in-progress derbies, if any. Will defer
    // to the generic spectating functionality provided by the Games API.
    async onDerbyWatchCommand(player) {
        const params = new GameCommandParams();
        params.type = GameCommandParams.kTypeWatch;

        return this.#games_().executeGameCommand(DerbyGame, player, params);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        server.commandManager.removeCommand('derby');

        this.#registry_ = null;
        this.#games_ = null;
    }
}
