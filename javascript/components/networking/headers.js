// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Utility function to normalize a header name. For simplicity we consider this lowercasing.
const normalize = (input) => input.toLowerCase();

// Implementation of the JavaScript Headers class:
// https://fetch.spec.whatwg.org/#headers-class
export class Headers {
    #headers_ = new Map();

    constructor(init = null) {
        if (Array.isArray(init)) {
            for (const entry of init) {
                if (!Array.isArray(entry) || entry.length != 2) {
                    throw new Error(`Initializing Headers with an array requires a sequence of ` +
                                    `[ [ "Content-Type", "text/html" ] ] entries.`);
                }

                this.append(entry[0], entry[1]);
            }
        } else if (init instanceof Map) {
            for (const [ name, value ] of init)
                this.append(name, value);

        } else if (init !== null) {
            throw new Error(`Invalid HeadersInit value given to the constructor.`);
        }
    }

    // Appends the header with the given |name| & |value| to the set of headers. Multiple headers
    // with the same name are allowed.
    append(name, value) {
        const normalizedName = normalize(name);
        const header = this.#headers_.get(normalizedName);

        if (!header)
            return this.set(name, value);

        header.values.add(value);
    }

    // Deletes all headers with the given |name|.
    delete(name) { this.#headers_.delete(normalize(name)); }
    
    // Gets the value of the header with the given |name|.
    get(name) {
        const normalizedName = normalize(name);
        const header = this.#headers_.get(normalizedName);

        if (!header)
            return undefined;
        
        return Array.from(header.values).join(', ');
    }

    // Returns whether there's at least one header with the given |name|.
    has(name) { return this.#headers_.has(normalize(name)); }

    // Sets the |header|'s value to |name|. All other values of |header| will be removed.
    set(name, value) {
        const normalizedName = normalize(name);

        this.#headers_.set(normalizedName, {
            name, values: new Set([ value ])
        });
    }

    // Returns a [key, value] iterator to each of the headers.
    *[Symbol.iterator]() {
        for (const { name } of this.#headers_.values())
            yield [ name, this.get(name) ];
    }
}
