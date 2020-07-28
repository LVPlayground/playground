// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Provides the ability to execute a command given a player, a command and a command text. Parses
// the command textas necessary to figure out what exactly the player wants to do.
export class CommandExecutor {
    #contextDelegate_ = null;
    #permissionDelegate_ = null;

    constructor(contextDelegate, permissionDelegate) {
        this.#contextDelegate_ = contextDelegate;
        this.#permissionDelegate_ = permissionDelegate;
    }

    // Executes the given |command| for the |context|, who have given |commandText| as a string of
    // parameters that should be interpret based on the |command|'s configuration. Will always send
    // *some* form of communication back to the |context|.
    async executeCommand(context, command, commandText) {
        // TODO: Implement sub-commands and parameters.
        // TODO: Implement permission checks.

        return command.listener(context);
    }
}
