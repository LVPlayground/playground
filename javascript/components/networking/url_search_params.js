// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Implementation of the URLSearchParams class.
// https://url.spec.whatwg.org/#interface-urlsearchparams
export class URLSearchParams {
    #data_ = new Map();
    #sorted_ = false;

    constructor(init = null) {
        if (init && typeof init === 'string')
            init = init.split('&');
        if (init && Array.isArray(init) && init.length && typeof init[0] === 'string')
            init = init.map(value => value.split('='));

        if (init && Array.isArray(init)) {
            for (const [ name, value ] of init)
                this.append(name, value);
        } else if (init) {
            throw new Error(`Invalid value given to URLSearchParams: ${init}`);
        }
    }

    // Appends the |value| to the data identified by the given |name|.
    append(name, value) {
        const data = this.#data_.get(name);
        if (!data)
            return this.set(name, value);
        
        data.add(String(value));
    }

    // Deletes all known data with the given |name|.
    delete(name) { this.#data_.delete(name); }

    // Returns the first value for entries with the given |name|.
    get(name) {
        const data = this.#data_.get(name);
        if (!data)
            return undefined;
        
        return Array.from(data).shift();
    }

    // Returns a sequence with all values for the given |name|.
    getAll(name) {
        const data = this.#data_.get(name);
        const result = [];
        
        if (!data)
            return result;
        
        for (const value of data)
            result.push(value);
        
        return result;
    }

    // Returns whether this object contains an entry with the given |name|.
    has(name) { return this.#data_.has(name); }

    // Sets the data with the given |name| to |value|.
    set(name, value) { this.#data_.set(name, new Set([ String(value) ])); }

    // Sorts the output in the parameters alphabetically by name.
    sort() { this.#sorted_ = true; }

    // Enables iteration over all of the FormData values.
    *[Symbol.iterator]() {
        const names = Array.from(this.#data_.keys());
        if (this.#sorted_)
            names.sort();

        for (const name of names) {
            const values = this.#data_.get(name);
            for (const value of values)
                yield [ name, value ];
        }
    }

    // Converts the URLSearchParams instance to a string representation.
    toString() {
        // TODO: Escaping?

        const params = [];
        for (const [ name, value ] of this)
            params.push(`${name}=${value}`);
        
        return params.join('&');
    }
}
