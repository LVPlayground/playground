// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { format } from 'base/format.js';

// Represents a collection of messages. Each of the individual messages will be made available as
// read-only properties on the instance, typed as an instance of the Message class that provides
// both localization and formatting as appropriate.
export class Messages {
    #messages_ = null;

    constructor() {
        this.#messages_ = new Map();
    }

    // Gets an iterator that can be used to iterate over this collection, as [ [key, value] ].
    [Symbol.iterator]() { return this.#messages_.entries(); }

    // Gets the number of messages that has been defined on this collection.
    get size() { return this.#messages_.size; }

    // Extends |this| instance with the given |messages|, which must be an object in which both the
    // keys and values are strings. Returns |this| instance again to provide access.
    extend(messages) {
        // (1) Unset all the |messages| which are already known to the instance. The `unset` method
        // protects against removing messages that have not been created yet.
        for (const message of Object.keys(messages))
            this.unset(message);

        // (2) Install all the |messages| on |this| object.
        for (const [ message, text ] of Object.entries(messages)) {
            this.#messages_.set(message, text);

            Object.defineProperty(this, message, {
                value: Messages.prototype.format.bind(this, message),
                configurable: true,
                writable: false,
            });
        }

        return this;
    }

    // Formats the given |message|, substituting the |params| per the format() syntax defined in
    // //base/format.js. The text will be retrieved from our local database.
    format(message, options, ...params) {
        if (!this.#messages_.has(message))
            throw new Error(`Invalid message supplied: ${message}`);

        return format(this.#messages_.get(message), ...params);
    }

    // Removes an individual |message| from |this| collection. Removes it both from our internal
    // collection, as well as the property defined on |this| instance.
    unset(message) {
        if (!this.#messages_.has(message))
            return;

        this.#messages_.delete(message);
        delete this[message];
    }
}

// Exports the global `globalMessages` object, used for all messages defined on the server.
export const globalMessages = new Messages();
