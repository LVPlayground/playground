// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Describes a parameter that can be accepted by a particular command.
export class CommandParameter {
    // Type of command parameters that are recognised by the system.
    static kTypeNumber = 0;
    static kTypePlayer = 1;
    static kTypeText = 2;

    #defaultValue_ = null;
    #name_ = null;
    #optional_ = null;
    #type_ = null;

    // Gets the name of the parameter. Will be presented to players.
    get name() { return this.#name_; }

    // Gets a boolean indicating whether this parameter is optional.
    get optional() { return this.#optional_; }

    // Gets the default value that will be used when no value has been given.
    get defaultValue() { return this.#defaultValue_; }

    // Gets the type of data this parameter constitutes of.
    get type() { return this.#type_; }

    constructor({ name, optional, defaultValue, type }) {
        this.#defaultValue_ = defaultValue;
        this.#name_ = name;
        this.#optional_ = optional;
        this.#type_ = type;
    }

    toString() {
        if (this.#defaultValue_ !== null && this.#defaultValue_ !== undefined)
            return `[${this.#name_}=${this.#defaultValue_}]`;
        else if (this.#optional_)
            return `[${this.#name_}]?`;
        else
            return `[${this.#name_}]`;
    }
}
