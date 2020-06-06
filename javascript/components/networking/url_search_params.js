// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { range } from 'base/range.js';
import { stringToUtf8Buffer, utf8BufferToString } from 'components/networking/utf-8.js';

// The characters which a HEX string can be formatted as; base-16.
const kHexCharacters = '0123456789ABCDEF'.split('');

// The characters that are safe to use in encoded strings.
const kSafeCharacters = new Set([
    ...range(0x30, 0x39), 0x39,  // numbers
    ...range(0x41, 0x5A), 0x5A,  // uppercase characters
    ...range(0x61, 0x7A), 0x7A,  // lowercase characters
    0x2D, 0x2E, 0x5F, 0x2A,      // { - . _ * }, url-safe characters
]);

// Decodes the given |value| per the rules of HTML:
// http://www.w3.org/TR/html4/interact/forms.html#h-17.13.4.1
function decode(value) {
    const buffer = new Uint8Array(stringToUtf8Buffer(value));
    const output = [];

    for (let index = 0; index < buffer.length; ++index) {
        const character = buffer[index];

        // Convert spaces back to.. spaces, as they're represented by plus signs.
        if (character === /* + */ 0x2B) {
            output.push(0x20);  // space
            continue;
        }

        // If this isn't a percentage sign, it's a pass-through character.
        if (character !== /* % */ 0x25) {
            output.push(character);
            continue;
        }

        // Ignore invalid encoded text, nothing we can do for partial input.
        if ((index + 2) >= buffer.length) {
            index += 2;
            continue;
        }

        const major = kHexCharacters.indexOf(String.fromCharCode(buffer[++index]));
        const minor = kHexCharacters.indexOf(String.fromCharCode(buffer[++index]));

        if (major === -1 || minor === -1)
            continue;  // invalid code point

        output.push(major * 16 + minor);
    }

    return utf8BufferToString(new Uint8Array(output));
}

// Encodes the given |value| per the rules of HTML:
// http://www.w3.org/TR/html4/interact/forms.html#h-17.13.4.1
function encode(value) {
    const buffer = new Uint8Array(stringToUtf8Buffer(value));
    const output = [];

    for (let index = 0; index < buffer.length; ++index) {
        const character = buffer[index];

        if (kSafeCharacters.has(character)) {
            output.push(character);
        } else if (character === /* space */ 0x20) {
            output.push(0x2B);  // +
        } else {
            output.push(0x25);  // %
            output.push(kHexCharacters[Math.floor(character / 16)].charCodeAt(0));
            output.push(kHexCharacters[character % 16].charCodeAt(0));
        }
    }

    return utf8BufferToString(new Uint8Array(output));
}

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
                this.append(decode(name), decode(value));
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
        const params = [];
        for (const [ name, value ] of this)
            params.push(`${encode(name)}=${encode(value)}`);
        
        return params.join('&');
    }
}
