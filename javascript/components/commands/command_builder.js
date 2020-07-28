// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandDescription } from 'components/commands/command_description.js';

// Provides the ability to build commands, for which the output is a CommandDescription object. When
// building a command, the command's prefix has to be known ahead of time.
export class CommandBuilder {
    #description_ = null;
    #listener_ = null;
    #name_ = null;
    #parent_ = null;
    #prefix_ = null;

    constructor({ listener, name, parent = null, prefix = null }) {
        this.#listener_ = listener;
        this.#name_ = name;
        this.#parent_ = parent;
        this.#prefix_ = prefix;
    }

    // Sets the given |description| to be associated with this command. Returns |this| instance.
    description(description) {
        this.#description_ = description;
        return this;
    }

    build(listener) {
        if (typeof listener !== 'function')
            throw new Error(`Commands must be built using a listener function.`);

        // (1) Construct the CommandDescription instance for this command.
        const description = new CommandDescription({
            command: `${this.#prefix_}${this.#name_}`,
            commandName: this.#name_,
            description: this.#description_,
            listener: listener,
            parameters: [],
            subs: new Map(),
        });

        // (2) Tell the defined listener about the description that's been created.
        this.#listener_(description);
    }
}
