// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';
import { PlayerCommand } from 'features/player_commands/player_command.js';

// The directory in which the command definitions are located, and the include path through which
// we can import them to JavaScript with dynamic import statements.
const kCommandDirectory = 'javascript/features/player_commands/commands/';
const kCommandIncludePath = 'features/player_commands/commands/';

// Loads and keeps track of the sub-commands available to "/my" and "/p". Generates help messages
// tailored to particular players with the functionality available to them.
export class PlayerCommandRegistry {
    #commands_ = null;
    #params_ = null;

    constructor(...params) {
        this.#commands_ = new Set();
        this.#params_ = params;
    }

    // Asynchronously loads all defined commands, and builds the "/my" and "/p" commands on the
    // server. Has to be called explicitly when running tests.
    async initialize() {
        // (1) Build the set of player commands supported by Las Venturas Playground.
        for (const filename of glob(kCommandDirectory, '^((?!test).)*\.js$')) {
            const exports = await import(kCommandIncludePath + filename);
            for (const constructor of Object.values(exports)) {
                if (!PlayerCommand.isPrototypeOf(constructor))
                    continue;  // the |constructor| is not a PlayerCommand class

                const command = new constructor(...this.#params_);
                if (!(command instanceof PlayerCommand))
                    throw new Error(`Source file "${filename}" does not export a player command.`);

                this.#commands_.add(command);
            }
        }

        // (2) Initialize the builders through which the individual commands will be registered.
        const myBuilder = server.commandManager.buildCommand('my');
        const playerBuilder = server.commandManager.buildCommand('p')
            .sub(CommandBuilder.PLAYER_PARAMETER);
        
        // (3) Iterate over all the commands, and add them to both "/my" and "/p".
        for (const command of this.#commands_) {
            myBuilder.sub(command.name)
                .restrict(command.playerLevel)
                .parameters(command.parameters)
                .build(PlayerCommandRegistry.prototype.onCommand.bind(
                    this, command, /* subject= */ null));

            playerBuilder.sub(command.name)
                .restrict(command.administratorLevel)
                .parameters(command.parameters)
                .build(PlayerCommandRegistry.prototype.onCommand.bind(this, command));
        }

        // (4) Register the "/my" command with the server. We already closed the last sub-command.
        myBuilder
            .parameters([
                { name: 'params', type: CommandBuilder.SENTENCE_PARAMETER, optional: true }
            ])
            .build(PlayerCommandRegistry.prototype.onMyCommand.bind(this));

        // (5) Register the "/p" command with the server. The sub-command requiring the player
        // parameter is still open, so that has to be closed first.
        playerBuilder
                .parameters([
                     { name: 'params', type: CommandBuilder.SENTENCE_PARAMETER, optional: true }
                ])
                .build(PlayerCommandRegistry.prototype.onPlayerCommand.bind(this))
            .build(PlayerCommandRegistry.prototype.onPlayerCommand.bind(this));
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |player| has executed the |command|, optionally for |subject| when they are
    // an administrator and have sufficient access. The |params| should be passed through.
    async onCommand(command, subject, player, ...params) {
        const self = subject ?? player;

        // Bail out if the |player| is using the command on themselves, it requires VIP access and
        // they don't have VIP access. Administrators cannot cheat this way either.
        if (self === player && command.requireVip && !player.isVip()) {
            player.sendMessage(Message.PLAYER_COMMANDS_REQUIRES_VIP);
            return;
        }

        // Execute the |command| and wait for it to be complete.
        return await command.execute(self, player, ...params);
    }

    // Called when the |player| has executed the "/my" command with parameters that could not be
    // fully understood, and thus should be displayed a help message.
    onMyCommand(player, params) {
        // TODO: Migrate all the player commands to JavaScript, then display a help message here.
        if (server.isTest())
            return;

        wait(0).then(() => pawnInvoke('OnPlayerCommand', 'is', player.id, '/my ' + (params ?? '')));
    }

    // Called when the |player| has executed the "/p" command with parameters that could not be
    // fully understood, and thus has to be displayed a help message.
    onPlayerCommand(player, target, params) {
        // TODO: Migrate all the player commands to JavaScript, then display a help message here.
        if (server.isTest())
            return;

        const command = target ? `/p ${target.id} ${params}`
                               : '/p';

        wait(0).then(() => pawnInvoke('OnPlayerCommand', 'is', player.id, command));
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        for (const command of this.#commands_)
            command.dispose();

        this.#commands_.clear();
        this.#commands_ = null;

        this.#params_ = null;

        if (!server.commandManager.hasCommand('my'))
            return;  // the commands never were registered

        server.commandManager.removeCommand('my');
        server.commandManager.removeCommand('p');
    }
}
