// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandParameter } from 'components/commands/command_parameter.js';

// A command key describes the "keying" of a sub command. This would usually be a fixed word, but
// can also be a substitution or a dynamic value of sorts, such as "a player".
export class CommandKey {
    #name_ = null;
    #optional_ = null;
    #type_ = null;
    #value_ = null;

    // Gets the name of this command key.
    get name() { return this.#name_; }

    // Gets a boolean indicating whether this command key is optional. Only valid for player values.
    get optional() { return this.#optional_; }

    // Gets the type of command key that's expected.
    get type() { return this.#type_; }

    // Gets the value when the |type| should be predetermined, i.e. a fixed string.
    get value() { return this.#value_; }

    constructor({ name, optional, type, value }) {
        switch (type) {
            case CommandParameter.kTypeNumber:
            case CommandParameter.kTypeText:
                if (optional)
                    throw new Error(`Only player-based keys can be marked as optional.`);

                break;
        }

        this.#name_ = name;
        this.#optional_ = optional;
        this.#type_ = type;
        this.#value_ = value;
    }

    toString() {
        if (this.#value_ !== null)
            return String(this.#value_);
        else if (this.#optional_)
            return `[${this.#name_}=you]`;
        else
            return `[${this.#name_}]`;
    }
}
