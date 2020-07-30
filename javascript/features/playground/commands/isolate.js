// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Command } from 'features/playground/command.js';
import { CommandBuilder } from 'components/command_manager/command_builder.js';
import { ScopedCallbacks } from 'base/scoped_callbacks.js';

// Range within a random virtual world will be chosen for the isolated player.
const RANGE_MIN = 550000000;
const RANGE_MAX = 560000000;

// Command: /isolate [player]
class IsolateCommand extends Command {
    constructor(...args) {
        super(...args);

        this.isolatedWorld_ = new WeakMap();

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerspawn', IsolateCommand.prototype.onPlayerSpawn.bind(this));
    }

    get name() { return 'isolate'; }
    get defaultPlayerLevel() { return Player.LEVEL_ADMINISTRATOR; }

    build(commandBuilder) {
        commandBuilder
            .parameters([ { name: 'target', type: CommandBuilder.PLAYER_PARAMETER } ])
            .build(IsolateCommand.prototype.onIsolateCommand.bind(this));
    }

    // Called when the |player| wishes to isolate |target|.
    onIsolateCommand(player, target) {
        if (target.syncedData.isIsolated()) {
            player.sendMessage(Message.COMMAND_ERROR, target.name + ' is already isolated.');
            return;
        }

        this.isolatedWorld_.set(
            target, Math.floor(Math.random() * (RANGE_MAX - RANGE_MIN)) + RANGE_MIN);

        // Isolating a player deliberately messes up their player state, so we don't allow a reset
        // back to being a regular player. Isolation is final until reconnection.
        target.syncedData.setIsolated(true);

        player.sendMessage(Message.COMMAND_SUCCESS, target.name + ' has been isolated.');

        // Announce the isolation to in-game administrators, since the consequences are severe.
        this.announce_().announceToAdministrators(
                Message.LVP_ANNOUNCE_PLAYER_ISOLATED_1, target.name, target.id, player.name,
                player.id);
        this.announce_().announceToAdministrators(Message.LVP_ANNOUNCE_PLAYER_ISOLATED_2);
    }

    // Called when a player spawns into the world.
    onPlayerSpawn(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player || !player.syncedData.isIsolated())
            return;  // invalid |player|, or non-isolated player

        if (!this.isolatedWorld_.has(player))
            return;  // huh?

        // Use pawnInvoke() because the regular `virtualWorld` property has been blocked.
        pawnInvoke('SetPlayerVirtualWorld', 'ii', player.id, this.isolatedWorld_.get(player));
    }

    dispose() {
        this.callbacks_.dispose();
        this.callbacks_ = null;
    }
}

export default IsolateCommand;
