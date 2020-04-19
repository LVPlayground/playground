// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandError } from 'components/command_manager/command_error.js';

// Implementation of the CommandDelegate interface for in-game usage.
export default class CommandGameDelegate {
    // Returns the prefix to show before command names in usage and error messages.
    getCommandPrefix() {
        return '/';
    }

    // Returns whether the |player is registered with the server.
    isRegistered(player) {
        return player.isRegistered();
    }

    // Returns the level of the |source|, which in this case is a Player.
    getSourceLevel(player) {
        return player.level;
    }

    // Sends the given |error| to the |player|, with the given |parameters|.
    sendErrorMessage(player, error, ...params) {
        let message = null;

        switch (error) {
            case CommandError.kInsufficientRights:
                message = Message.COMMAND_ERROR_INSUFFICIENT_RIGHTS;
                break;
            
            case CommandError.kNotRegistered:
                message = Message.COMMAND_ERROR_INSUFFICIENT_RIGHTS_BETA;
                break;
            
            case CommandError.kUnknownPlayer:
                message = Message.COMMAND_ERROR_UNKNOWN_PLAYER;
                break;

            case CommandError.kInvalidUse:
                message = Message.COMMAND_USAGE;
                break;

            default:
                throw new Error('Unknown error: ' + error);
        }

        player.sendMessage(Message.format(message, ...params));
    }
}
