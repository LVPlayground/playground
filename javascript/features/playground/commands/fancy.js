// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Command from 'features/playground/command.js';
import CommandBuilder from 'components/command_manager/command_builder.js';
import { ScopedCallbacks } from 'base/scoped_callbacks.js';

// Command: /fancy [player] [none/parrot]
class FancyCommand extends Command {
    constructor() {
        super();

        this.fancy_ = new WeakMap();

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerspawn', FancyCommand.prototype.onPlayerSpawn.bind(this));
    }

    get name() { return 'fancy'; }
    get defaultPlayerLevel() { return Player.LEVEL_ADMINISTRATOR; }

    build(commandBuilder) {
        commandBuilder
            .parameters([
                { name: 'player', type: CommandBuilder.PLAYER_PARAMETER },
                { name: 'type', type: CommandBuilder.WORD_PARAMETER, optional: true }
            ])
            .build(FancyCommand.prototype.onFancyCommand.bind(this));
    }

    onFancyCommand(player, target, type) {
        const subject = target || player;

        switch (type) {
            case 'none':
                this.fancy_.delete(subject);

                pawnInvoke('RemovePlayerAttachedObject', 'ii', subject.id, 0);

                player.sendMessage(
                    Message.COMMAND_SUCCESS, subject.name + ' is not fancy anymore :(.');
                break;

            case 'parrot':
            case 'cow':
                this.fancy_.set(subject, type);
                this.onPlayerSpawn({ playerid: subject.id });

                player.sendMessage(
                    Message.COMMAND_SUCCESS, subject.name + ' is now a ' + type + '.');
                break;

            default:
                player.sendMessage(Message.COMMAND_USAGE, '/fancy [player] [none/cow/parrot]');
                break;
        }
    }

    onPlayerSpawn(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // invalid |player| given for the |event|

        const type = this.fancy_.get(player);
        if (!type)
            return;  // the |player| isn't fancy

        switch (type) {
            case 'parrot':
                pawnInvoke('SetPlayerAttachedObject', 'iiiifffffffffii', player.id, 0, 19079, 16,
                           0.12, 0.05, 0, 180, 270, 0, 1, 1, 1, 0xFFFFFF00, 0xFFFFFF00);
                break;

            case 'cow':
                pawnInvoke('SetPlayerAttachedObject', 'iiiifffffffff',  player.id, 0, 19833, 1, 
                            -3.14, 0, 0, 180, 90, 0, 3.14, 3.14, 3.14);
                break;
        }
    }

    dispose() {
        for (const player of server.playerManager) {
            if (this.fancy_.has(player))
                pawnInvoke('RemovePlayerAttachedObject', 'ii', player.id, 0);
        }

        this.fancy_ = null;

        this.callbacks_.dispose();
        this.callbacks_ = null;
    }
}

export default FancyCommand;
