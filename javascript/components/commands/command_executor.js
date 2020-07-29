// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandParameter } from 'components/commands/command_parameter.js';

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
        const candidates = this.matchPossibleCommands(context, command, commandText);

        for (const [ description, commandText, parameters ] of candidates) {
            // TODO: Match the |command|'s parameters against |commandText|.

            return command.listener(context, ...parameters);
        }

        // TODO: Send an error message when no |candidates| were found.
    }

    // Executes a breadth-first search on the sub-commands that exist for the given |command| to see
    // how deep we can get while |commandText| matches those, ignoring parameters. An array will be
    // returned, in order of specificity, with the possible CommandDescription and parameter string.
    matchPossibleCommands(context, command, commandText) {
        const queue = [ [ command, commandText, /* parameters= */ [] ] ];
        const commands = [];

        while (queue.length) {
            const [ command, commandText, parameters ] = queue.shift();

            if (!this.canExecuteCommand(context, command))
                continue;  // the |context| does not have access to this |description|

            // Store the |command| as this has just become a candidate for execution.
            commands.push([ command, commandText, parameters ]);

            // Iterate over all the sub-commands that exist for the given |command|.
            for (const [ subCommandKey, subCommand ] of command.subs) {
                const result = this.matchCommandKey(context, subCommandKey, commandText);
                if (!result.match)
                    continue;  // the |commandKey| would not yield a match based on parameters

                // Determine the parameters to carry forward for the sub-command. When the |match|
                // includes a value, it should be included when executing the listener.
                const subParameters =
                    result.parameter !== undefined ? [ ...parameters, result.parameter ]
                                                   : [ ...parameters ];

                // Store the result as one to visit in the future, which also checks permission.
                queue.push([ subCommand, result.commandText, subParameters ]);
            }
        }

        // Reverse the |commands| to get them listed in order of specificity.
        return commands.reverse();
    }

    // Matches the given |commandKey| against the given |commandText|. An object will be returned
    // that follows the structure of { match, commandText, parameter? }, where |match| is a boolean,
    // |commandText| contains the remaining command text, and |parameter| the value.
    matchCommandKey(context, commandKey, commandText) {
        switch (commandKey.type) {
            case CommandParameter.kTypeNumber:
            case CommandParameter.kTypePlayer:
            case CommandParameter.kTypeText:
                break;
        }
    }

    // Returns whether the |context| is allowed to execute the given |command|. This operation is
    // synchronous and provided delegates are expected to be fast.
    canExecuteCommand(context, command) {
        return this.#permissionDelegate_.canExecuteCommand(context, this.#contextDelegate_, command)
    }
}
