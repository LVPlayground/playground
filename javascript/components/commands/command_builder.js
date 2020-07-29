// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandDescription } from 'components/commands/command_description.js';
import { CommandKey } from 'components/commands/command_key.js';
import { CommandParameter } from 'components/commands/command_parameter.js';

// Provides the ability to build commands, for which the output is a CommandDescription object. When
// building a command, the command's prefix has to be known ahead of time. The command builder is
// critical to most things players can interact with on Las Venturas Playground. Sample usage:
//
// server.commandManager.buildCommand('fruit')
//     .description('Indicate that you want some fruit')
//     .sub('banana')
//         .description('The fruit you want is a banana')
//         .build(player => player.sendMessage('You wanted a banana!'))
//     .sub(CommandBuilder.kTypeText, 'fruit')
//         .description('The fruit you want is something else')
//         .build((player, fruit) => player.sendMessage('You wanted a ' + fruit))
//     .build(player => player.sendMessage('What fruit do you want?'));
//
// Using indentation as above is strongly recommended to keep the level of command readable, as more
// complicated commands are able to have any number of levels and parameters.
export class CommandBuilder {
    // Types of sub-commands that can be created.
    static kTypeNumber = CommandParameter.kTypeNumber;
    static kTypePlayer = CommandParameter.kTypePlayer;
    static kTypeText = CommandParameter.kTypeText;

    #description_ = null;
    #listener_ = null;
    #name_ = null;
    #parent_ = null;
    #prefix_ = null;
    #restrictLevel_ = null;
    #restrictTemporary_ = null;
    #subs_ = null;

    constructor({ listener, name, parent = null, prefix = null }) {
        this.#listener_ = listener;
        this.#name_ = name;
        this.#parent_ = parent;
        this.#prefix_ = prefix;
        this.#subs_ = new Map();
    }

    // Sets the given |description| to be associated with this command, which are required for all
    // commands as it can be used to explain to the player what it does. Returns |this| instance.
    description(description) {
        this.#description_ = description;
        return this;
    }

    // Sets the default level restriction on this command to |level|. The |restrictTemporary| flag
    // may optionally be given as well, which restricts it for temporary administrators.
    restrict(level, restrictTemporary = false) {
        this.#restrictLevel_ = level;
        this.#restrictTemporary_ = !!restrictTemporary;
        return this;
    }

    // Creates a sub-command for this one. The |command| can either be one of the kType* constants
    // defined above, or a string when an exact word match is expected.
    sub(command, name = null, optional = false) {
        let commandKey = null;

        // (1) Create the CommandKey instance that matches the requirements for this sub-command,
        // which the CommandExecutor will use to determine what to execute.
        switch (command) {
            case CommandBuilder.kTypePlayer:
                if (typeof name !== 'string')
                    throw new Error(`${name}: a name for the sub-command value must be given.`);

                commandKey = new CommandKey(name, !!optional, CommandBuilder.kTypePlayer);
                break;

            case CommandBuilder.kTypeNumber:
            case CommandBuilder.kTypeText:
                if (typeof name !== 'string')
                    throw new Error(`${name}: a name for the sub-command value must be given.`);

                commandKey = new CommandKey(name, /* optional= */ false, command);
                break;

            default:
                if (typeof command !== 'string')
                    throw new Error(`${this}: only textual sub-commands may be added.`);

                commandKey = new CommandKey(
                    command, /* optional= */ false, CommandParameter.kTypeText, command);
                break;
        }

        // (2) Make sure that the |commandKey| isn't ambiguous with a previously defined sub-command
        // as this would make it hard for players to reason about what should be executed, when.
        for (const otherCommandKey of this.#subs_.keys()) {
            if (otherCommandKey.type === CommandBuilder.kTypePlayer)
                throw new Error(`"${commandKey.name}" cannot be preceeded by a player sub-command`);

            if (otherCommandKey.type === CommandBuilder.kTypeText && !otherCommandKey.value)
                throw new Error(`"${commandKey.name}" cannot be preceeded by a text sub-command`);
        }

        // (3) Create and return a new CommandBuilder instance for the sub-command. The listener
        // will register the sub-command with our own state.
        return new CommandBuilder({
            listener: description => {
                this.#subs_.set(commandKey, description);
            },

            name: `${commandKey}`,
            parent: this,
            prefix: `${this.#prefix_}${this.#name_} `,
        });
    }

    build(listener) {
        if (typeof listener !== 'function')
            throw new Error(`${this}: cannot be built without a listener function.`);

        // (1) Require that a description has been given for this command, which is mandatory.
        if (!this.#description_)
            throw new Error(`${this}: a description is required`);

        // (2) Construct the CommandDescription instance for this command.
        const description = new CommandDescription({
            command: `${this.#prefix_}${this.#name_}`,
            commandName: this.#name_,
            description: this.#description_,
            listener: listener,
            parameters: [],
            restrictLevel: this.#restrictLevel_,
            restrictTemporary: this.#restrictTemporary_,
            subs: this.#subs_,
        });

        // (3) Tell the defined listener about the description that's been created.
        this.#listener_(description);

        return this.#parent_;
    }

    toString() {
        if (this.#name_)
            return `[object CommandBuilder("${this.name}")]`;
        else
            return `[object CommandBuilder]`;
    }
}
