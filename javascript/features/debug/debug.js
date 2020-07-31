// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';
import { Feature } from 'components/feature_manager/feature.js';

// The debug feature offers useful tools for administrators to debug the server or the Las Venturas
// Playground gamemode itself. It's driven by a number of in-game comments.
export default class Debug extends Feature {
    constructor() {
        super();

        // /serverfps
        server.commandManager.buildCommand('serverfps')
            .description(`Displays the current performance of the server.`)
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .build(Debug.prototype.onServerFrameCounterCommand.bind(this));

        // /eval
        server.commandManager.buildCommand('eval')
            .description(`Evaluates JavaScript code on the server.`)
            .restrict(Player.LEVEL_MANAGEMENT)
            .parameters([ { name: 'command', type: CommandBuilder.kTypeText } ])
            .build(Debug.prototype.onEvaluateCommand.bind(this));

        // /idlers
        server.commandManager.buildCommand('idlers')
            .description('Displays a list of players who are currently idle.')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .build(Debug.prototype.idlers.bind(this));
    }

    // Displays the number of FPS the server was able to handle since the last call to this command.
    onServerFrameCounterCommand(player) {
        const statistics = global.frameCounter();

        player.sendMessage(Message.DEBUG_FRAME_COUNTER, statistics.fps, statistics.duration / 1000);
    }

    // Evaluates the |command| on behalf of |player|.
    onEvaluateCommand(player, command) {
        console.log('[JavaScript] Evaluating: ' + command);

        // Utility functions that are often used with the `/eval` command.
        const cm = server.commandManager;
        const fm = server.featureManager;
        const p = playerId => server.playerManager.getById(playerId);
        const vid = playerId => pawnInvoke('GetPlayerVehicleID', 'i', playerId);
        const v = playerId => server.playerManager.getById(playerId).vehicle;

        try {
            const output = '' + JSON.stringify(eval(command), null, '    ');
            const lines = output.split('\n');

            for (let i = 0; i < Math.min(8, lines.length); ++i)
                player.sendMessage('>> ' + lines[i]);

            if (lines.length > 8)
                player.sendMessage('>> Omitted ' + (lines.length - 8) + ' lines.');

        } catch (error) {
            player.sendMessage('>> ' + error.name + ': ' + error.message);
        }
    }

    // Lists the players who currently have minimized their game.
    idlers(player) {
        const idlers = [];

        for (const player of server.playerManager) {
            if (player.isMinimized())
                idlers.push(player.name);
        }

        if (!idlers.length)
            player.sendMessage('Nobody minimized their game.');
        else
            player.sendMessage('Minimized: ' + idlers.sort().join(', '));
    }

    dispose() {
        server.commandManager.removeCommand('serverfps');
        server.commandManager.removeCommand('eval');
        server.commandManager.removeCommand('idlers');
    }
}
