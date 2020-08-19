// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { format } from 'base/format.js';

// Represents a collection of messages. Each of the individual messages will be made available as
// read-only properties on the instance, typed as an instance of the Message class that provides
// both localization and formatting as appropriate.
export class Messages {
    #messages_ = null;
    #placeholders_ = null;

    constructor() {
        this.#messages_ = new Map();
        this.#placeholders_ = [
            [ '@error', '{DC143C}Error{FFFFFF}:' ],
            [ '@fyi', '{33AA33}FYI{FFFFFF}:' ],
            [ '@success', '{33AA33}Success{FFFFFF}:' ],
            [ '@usage', '{FF9900}Usage{FFFFFF}:' ],
        ];
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

            const messageFunction = Messages.prototype.format.bind(this, message);
            messageFunction.toString = () => messageFunction.call(null, null);

            Object.defineProperty(this, message, {
                value: messageFunction,
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

        let text = this.#messages_.get(message);
        for (const [ placeholder, replacement ] of this.#placeholders_)
            text = text.replaceAll(placeholder, replacement);

        return format(text, ...params);
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
