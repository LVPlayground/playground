// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandParameter } from 'components/commands/command_parameter.js';

// Regular expression used to match numbers in a command text string.
const kNumberExpression = /^([-+]?\d+(\.\d+)?|0x[0-9a-f]+)\b\s*/i;

// Regular expression used to match text in a command text string.
const kTextExpression = /^(.+?)\b\s*/;

// Provides the ability to execute a command given a player, a command and a command text. Parses
// the command textas necessary to figure out what exactly the player wants to do.
export class CommandExecutor {
    #contextDelegate_ = null;
    #permissionDelegate_ = null;

    constructor(contextDelegate, permissionDelegate) {
        this.#contextDelegate_ = contextDelegate;
        this.#permissionDelegate_ = permissionDelegate;
    }

    // ---------------------------------------------------------------------------------------------

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

    // ---------------------------------------------------------------------------------------------
    // Section: handling of sub-commands
    // ---------------------------------------------------------------------------------------------

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

    // ---------------------------------------------------------------------------------------------
    // Section: ability to read data from the command text
    // ---------------------------------------------------------------------------------------------

    // Reads a number from the given |commandText|. Regular integers (both positive and negative),
    // floating point values and hexadecimal numbers are supported by this method. Returns a
    // structure following the syntax of { match, value }.
    readNumber(commandText) {
        const result = commandText.match(kNumberExpression);
        if (!result)
            return null;

        // Case 1: Decimal numbers (0.123, -0.123).
        if (result[2] !== undefined)
            return { match: result[0], value: parseFloat(result[1]) };

        // Case 2: Hexadecimal numbers (0x80, 0xAABBCCDD).
        if (result[0].includes('x') || result[0].includes('X'))
            return { match: result[0], value: parseInt(result[1].substring(2), 16) };

        // Case 2: Integer numbers (123, -123).
        return { match: result[0], value: parseInt(result[1], 10) };
    }

    // Reads a player from the given |commandText|. We allow for partial matching of a player's
    // nickname, as well as a fully qualified player ID, which is given priority.
    readPlayer(commandText) {
        const numberResult = this.readNumber(commandText);
        if (numberResult !== null) {
            const player = server.playerManager.getById(numberResult.value);
            if (player)
                return { match: numberResult.match, value: player };
        }

        const textResult = this.readText(commandText);
        if (textResult !== null) {
            const player = server.playerManager.getByName(textResult.value, /* fuzzy= */ true);
            if (player)
                return { match: textResult.match, value: player };
        }

        return null;
    }

    // Reads a single word from the given |commandText|. The word has to be separated by a word
    // boundary, which either is any amount of whitespace or the end of the string.
    readText(commandText) {
        const result = commandText.match(kTextExpression);
        if (!result)
            return null;

        return { match: result[0], value: result[1] };
    }

    // ---------------------------------------------------------------------------------------------

    // Returns whether the |context| is allowed to execute the given |command|. This operation is
    // synchronous and provided delegates are expected to be fast.
    canExecuteCommand(context, command) {
        return this.#permissionDelegate_.canExecuteCommand(context, this.#contextDelegate_, command)
    }
}
