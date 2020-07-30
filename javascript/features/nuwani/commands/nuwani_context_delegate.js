// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandContextDelegate } from 'components/commands/command_context_delegate.js';

// Implementation of the CommandContextDelegate specific to Nuwani.
export class NuwaniContextDelegate extends CommandContextDelegate {
    // Returns the player level that the |context| has, or its equivalent for the context. For IRC
    // we derive this information based on the status that they have in the echo channel.
    getLevel(context) { return context.level; }

    // Respond to the |context| informing them that they don't have access to run the command.
    respondWithAccessError(context) {
        context.respond(`4Error: Sorry, this command is not available to you.`);
    }

    // Respond to the |context| with usage information on the given |command|.
    respondWithUsage(context, command) {
        context.respond(`10Usage: ${command}`);
    }
}
