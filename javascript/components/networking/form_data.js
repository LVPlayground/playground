// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Implements the FormData Web interface. Note that, unlike `Headers`, names are case sensitive.
// https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData
export class FormData {
    #data_ = new Map();

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

    // Enables iteration over all of the FormData values.
    *[Symbol.iterator]() {
        for (const [ name, values ] of this.#data_) {
            for (const value of values)
                yield [ name, value ];
        }
    }
}
