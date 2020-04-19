// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandError } from 'components/command_manager/command_error.js';

// Implementation of the CommandDelegate interface for usage with IRC.
export class CommandDelegate {
    commandPrefix_ = null;

    constructor(commandPrefix) {
        this.commandPrefix_ = commandPrefix;
    }

    // Returns the prefix to show before command names in usage and error messages.
    getCommandPrefix() {
        return this.commandPrefix_;
    }

    // Returns whether the |context| is registered with the server. We always return TRUE here,
    // because the fact that someone is on IRC makes them a "player" by default.
    isRegistered(context) {
        return true;
    }

    // Returns the level of the |context| in the echo channel, as a Player level.
    getSourceLevel(context) {
        return context.getLevel();
    }

    // Sends the given |error| to the |context|, with the given |parameters|.
    sendErrorMessage(context, error, ...params) {
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

        // TODO: Actually bring this back to the |source| somehow.
        console.log('[IRC Error] ' + Message.format(message, ...params));
    }
}
