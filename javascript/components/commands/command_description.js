// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Describes an individual command that's available on Las Venturas Playground, including all the
// meta-information and access controls that are associated with it. Immutable once constructed.
export class CommandDescription {
    #command_ = null;
    #commandName_ = null;
    #description_ = null;
    #listener_ = null;
    #parameters_ = null;
    #restrictLevel_ = null;
    #restrictTemporary_ = null;
    #subs_ = null;

    // Gets the command that can be executed, which includes the prefix and parent naming.
    get command() { return this.#command_; }

    // Gets the name of the command that can be executed, which excludes the prefix.
    get commandName() { return this.#commandName_; }

    // Gets the human-readable description of this command. Will be presented to players.
    get description() { return this.#description_; }

    // Gets the listener that should be invoked once this command is executed.
    get listener() { return this.#listener_; }

    // Gets the parameters that are expected by the listener when executing this command.
    get parameters() { return this.#parameters_; }

    // Gets the level this command should be restricted to, if any.
    get restrictLevel() { return this.#restrictLevel_; }

    // Gets whether this command should be restricted to people who are temporarily at that level.
    get restrictTemporary() { return this.#restrictTemporary_; }

    // Gets the sub-commands that are part of this command description, as a map in which each key
    // is a CommandKey instance, and each value is a CommandDescription instance.
    get subs() { return this.#subs_.entries(); }

    constructor({ command, commandName, description, listener, parameters, restrictLevel,
                  restrictTemporary, subs }) {
        this.#command_ = command;
        this.#commandName_ = commandName;
        this.#description_ = description;
        this.#listener_ = listener;
        this.#parameters_ = parameters;
        this.#restrictLevel_ = restrictLevel;
        this.#restrictTemporary_ = restrictTemporary;
        this.#subs_ = subs;
    }

    toString() {
        let representation = this.#command_;

        // Prefer sub-command options over the local command option, but consider both in case there
        // are no sub-commands and we still have to display a representation.
        if (this.#subs_.size) {
            const dynamicSubs = [];
            const staticSubs = [];

            for (const commandKey of this.#subs_.keys()) {
                if (commandKey.value === null)
                    dynamicSubs.push(String(commandKey));
                else
                    staticSubs.push(String(commandKey));
            }

            // [bar/baz/foo/[target]]
            representation += ` [${[ ...staticSubs.sort(), ...dynamicSubs.sort() ].join('/')}]`;

        }

        if (this.#parameters_.length) {
            if (this.#subs_.size)
                representation += ' |';

            const parameters = [];

            for (const commandParameter of this.#parameters_)
                parameters.push(String(commandParameter));

            // [foo] [bar=4] [baz]?
            representation += ` ${parameters.join(' ')}`;
        }

        return representation;
    }
}
