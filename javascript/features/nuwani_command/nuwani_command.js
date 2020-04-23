// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';

// The `/nuwani` command enables in-game staff to understand, control and manage the Nuwani IRC
// system. Access to this command is controlled per `/lvp access`. This feature solely is the
// command, and provides no other functionality.
export default class NuwaniCommand extends Feature {
    nuwani_ = null;

    constructor() {
        super();

        // It's no surprise that the command will have to depend on the feature.
        this.nuwani_ = this.defineDependency('nuwani');

        // Provides access control for the command itself, configurable whilst in-game.
        this.playground_ = this.defineDependency('playground');
        this.playground_().registerCommand('nuwani', Player.LEVEL_MANAGEMENT);

        // Defines the `/nuwani` command. Access ins controlled by the Playground module.
        server.commandManager.buildCommand('nuwani')
            .restrict(player => this.playground_().canAccessCommand(player, 'nuwani'))
            .build(NuwaniCommand.prototype.onNuwaniCommand.bind(this));
    }

    // Called when the `/nuwani` command has been executed without parameters. Outputs the status.
    onNuwaniCommand(player) {
        const bots = {
            connected: [],
            disconnected: []
        };

        for (const bot of this.nuwani_().runtime.bots) {
            if (bot.isConnected())
                bots.connected.push(bot.nickname);
            else
                bot.disconnected.push(bot.nickname);
        }

        // Sort the bot names for each of the categories.
        bots.connected.sort();
        bots.disconnected.sort();

        if (bots.connected.length)
            player.sendMessage(Message.NUWANI_STATUS_CONNECTED, bots.connected.join(', '));
        if (bots.disconnected.length)
            player.sendMessage(Message.NUWANI_STATUS_DISCONNECTED, bots.disconnected.join(', '));
    }

    dispose() {
        this.playground_().unregisterCommand('house');
        this.nuwani_ = null;

        server.commandManager.removeCommand('house');
    }
}
