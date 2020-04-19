// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandError } from 'components/command_manager/command_error.js';

// Implementation of the CommandDelegate interface for usage with IRC.
export class CommandDelegate {
    commandPrefix_ = null;
    levels_ = null;

    constructor(commandPrefix, levels) {
        this.commandPrefix_ = commandPrefix;
        this.levels_ = levels;
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
        const channelModes = context.getSenderModesInEchoChannel();
        
        for (const mapping of this.levels_) {
            if (channelModes.includes(mapping.mode))
                return mapping.level;
        }

        return Player.LEVEL_PLAYER;
    }

    // Sends the given |error| to the |context|, with the given |parameters|.
    sendErrorMessage(context, error, ...params) {
        let message = null;

        switch (error) {
            case CommandError.kInsufficientRights:
                message = '4Error: Sorry, this command is only available to %s.';
                break;
            
            case CommandError.kUnknownPlayer:
                message = '4Error: Sorry, no player could be found for "%s".';
                break;

            case CommandError.kInvalidUse:
                message = '10Usage: %s';
                break;

            default:
                throw new Error('Unknown error: ' + error);
        }

        context.respond(Message.format(message, ...params));
    }
}
