// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandContextDelegate } from 'components/commands/command_context_delegate.js';

// Default implementation of the CommandContextDelegate interface, for usage with the SA-MP server
// itself. Assumes that Player instances will be given for the context.
export class DefaultContextDelegate extends CommandContextDelegate {
    // Returns the player level that the |context| has, or its equivalent for the context.
    getLevel(context) { return context.level; }

    // Respond to the |context| with an error that no players were found for the given |query|.
    respondWithUnknownPlayer(context, query) {
        context.sendMessage(Message.COMMAND_ERROR_UNKNOWN_PLAYER, query);
    }

    // Respond to the |context| with usage information on the given |command|.
    respondWithUsage(context, command) {
        context.sendMessage(Message.COMMAND_USAGE, command.toString());
    }
}
