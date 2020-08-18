// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandParameter } from 'components/commands/command_parameter.js';
import { CommandPermissionDelegate } from 'components/commands/command_permission_delegate.js';

// Regular expression used to match numbers in a command text string.
const kNumberExpression = /^([-+]?\d+(\.\d+)?|0x[0-9a-f]+)\b\s*/i;

// Regular expression used to match text in a command text string.
const kTextExpression = /^([^\s]+)\s*/;

// Provides the ability to execute a command given a player, a command and a command text. Parses
// the command textas necessary to figure out what exactly the player wants to do.
export class CommandExecutor {
    static kMatchParameterResultSuccess = 0;
    static kMatchParameterResultUnknownPlayer = 1;
    static kMatchParameterResultUnparseable = 2;

    #contextDelegate_ = null;
    #permissionDelegate_ = null;

    constructor(contextDelegate, permissionDelegate) {
        this.#contextDelegate_ = contextDelegate;
        this.#permissionDelegate_ = permissionDelegate;
    }

    // Allows overriding the permission delegate after this class has been instantiated.
    setPermissionDelegate(permissionDelegate) {
        if (!(permissionDelegate instanceof CommandPermissionDelegate))
            throw new Error(`The given delegate (${permissionDelegate}) must be a real delegate.`);

        this.#permissionDelegate_ = permissionDelegate;
    }

    // ---------------------------------------------------------------------------------------------

    // Executes the given |command| for the |context|, who have given |commandText| as a string of
    // parameters that should be interpret based on the |command|'s configuration. Will always send
    // *some* form of communication back to the |context|.
    async executeCommand(context, command, commandText) {
        const candidates = this.matchPossibleCommands(context, command, commandText);
        if (!candidates.length)
            return { description: command, success: false };

        // TODO: It's possible that a candidate doesn't match, in which case we might want to move
        // on to the next candidate. I suspect that this will be important for commands like `/v`.

        for (const [ description, commandText, parameters ] of candidates) {
            const [ result, params ] = this.matchParameters(context, description, commandText);
            switch (result) {
                case CommandExecutor.kMatchParameterResultSuccess:
                    await description.listener(context, ...parameters, ...params);
                    return { description, success: true };

                case CommandExecutor.kMatchParameterResultUnknownPlayer:
                    return { description, success: false };

                case CommandExecutor.kMatchParameterResultUnparseable:
                    this.#contextDelegate_.respondWithUsage(context, description);
                    return { description, success: false };
            }
        }
    }

    // ---------------------------------------------------------------------------------------------
    // Section: handling of parameters
    // ---------------------------------------------------------------------------------------------

    // Matches the parameters expected by the |command| against the |commandText|. When they can be
    // sufficiently matched an array will be returned, otherwise NULL will be returned.
    matchParameters(context, command, commandText) {
        const parameters = [];

        // Use a for loop as we have to recognise the final parameter to distinguish how text should
        // be handled. "Text" will consume one word, except when it's the last parameter.
        for (let index = 0; index < command.parameters.length; ++index) {
            const last = index === command.parameters.length - 1;
            const parameter = command.parameters[index];

            let result = null;
            switch (parameter.type) {
                case CommandParameter.kTypeNumber:
                    result = this.readNumber(commandText);
                    break;

                case CommandParameter.kTypePlayer:
                    result = this.readPlayer(commandText);
                    break;

                case CommandParameter.kTypeText:
                    if (last && commandText.length)
                        result = { match: commandText, value: commandText };
                    else
                        result = this.readText(commandText);

                    break;
            }

            // If a |result| was matched, add it to the |parameters| array, forward |commandText|
            // and proceed with the next parameter. This should be the common case.
            if (result) {
                commandText = commandText.substring(result.match.length);

                parameters.push(result.value);
                continue;
            }

            // Otherwise the parameter might be optional. We'd like to push the default value, which
            // might be "undefined", to the |parameters| array.
            if (parameter.optional && !commandText.length) {
                parameters.push(parameter.defaultValue);
                continue;
            }

            // If this is a player parameter, and no matches were found, that should be handled
            // differently too, as the error then is that not enough information was given.
            if (parameter.type === CommandParameter.kTypePlayer) {
                const queryResult = this.readText(commandText);
                if (queryResult) {
                    this.#contextDelegate_.respondWithUnknownPlayer(context, queryResult.value);
                    return [ CommandExecutor.kMatchParameterResultUnknownPlayer ];
                }
            }

            // Finally, there's text left or a parameter has not been given. Usage should be shown.
            return [ CommandExecutor.kMatchParameterResultUnparseable ];
        }

        return [ CommandExecutor.kMatchParameterResultSuccess, parameters ];
    }

    // ---------------------------------------------------------------------------------------------
    // Section: handling of sub-commands
    // ---------------------------------------------------------------------------------------------

    // Executes a breadth-first search on the sub-commands that exist for the given |command| to see
    // how deep we can get while |commandText| matches those, ignoring parameters. An array will be
    // returned, in order of specificity, with the possible CommandDescription and parameter string.
    matchPossibleCommands(context, command, commandText) {
        const stack = [ [ command, commandText, /* parameters= */ [] ] ];
        const commands = [];

        while (stack.length) {
            const [ command, commandText, parameters ] = stack.pop();

            if (context && !this.canExecuteCommand(context, command, !commands.length))
                continue;  // the |context| does not have access to this |description|

            // Store the |command| as this has just become a candidate for execution.
            commands.unshift([ command, commandText, parameters ]);

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
                stack.push([ subCommand, result.commandText, subParameters ]);
            }
        }

        return commands;
    }

    // Matches the given |commandKey| against the given |commandText|. An object will be returned
    // that follows the structure of { match, commandText, parameter? }, where |match| is a boolean,
    // |commandText| contains the remaining command text, and |parameter| the value.
    matchCommandKey(context, commandKey, commandText) {
        let result = null;

        switch (commandKey.type) {
            case CommandParameter.kTypeNumber:
                result = this.readNumber(commandText);
                break;

            case CommandParameter.kTypePlayer:
                result = this.readPlayer(commandText);
                break;

            case CommandParameter.kTypeText:
                result = this.readText(commandText);
                break;
        }

        // If there is no |result|, nothing in the |commandText| was able to match. Bail out, unless
        // this is an optional player parameter that defaults to the current |context|.
        if (!result) {
            if (commandKey.optional)
                return { match: true, commandText, parameter: context };

            return { match: false, commandText };
        }

        // Alternatively, determine if the |commandKey| has a fixed value, in which case the match
        // should not be added to the parameters. It will be implied when routing the command.
        if (commandKey.value) {
            if (result.value === commandKey.value)
                return { match: true, commandText: commandText.substring(result.match.length) };

            return { match: false, commandText };
        }

        // Finally, the |commandKey| is a dynamic parameter which has been matched in the given
        // |commandText|, which therefore has to be added as a parameter.
        return {
            match: true,
            commandText: commandText.substring(result.match.length),
            parameter: result.value,
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
    // synchronous and provided delegates are expected to be fast. The |verbose| argument indicates
    // whether any access errors should be shared with the |context| directly.
    canExecuteCommand(context, command, verbose) {
        return this.#permissionDelegate_.canExecuteCommand(
            context, this.#contextDelegate_, command, verbose)
    }
}
