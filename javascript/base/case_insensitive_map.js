// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// A variant of the built-in Map object that ignores casing of string-based keys.
export class CaseInsensitiveMap {
    map_ = new Map();

    // Gets the number of items that have been stored in the map.
    get size() { return this.map_.size; }

    // Map methods that aren't affected by changed casing.
    clear() { this.map_.clear(); }
    entries() { return this.map_.entries(); }
    forEach(callbackFn, thisArg) { return this.map_.forEach(callbackFn, thisArg); }
    keys() { return this.map_.keys(); }
    values() { return this.map_.values(); }
    [Symbol.iterator]() { return this.map_[Symbol.iterator]; }

    // Map methods that have to be amended for ignored casing.
    delete(key) { this.map_.delete(this.uniformCasing(key)); }
    get(key) { return this.map_.get(this.uniformCasing(key)); }
    has(key) { return this.map_.has(this.uniformCasing(key)); }
    set(key, value) { this.map_.set(this.uniformCasing(key), value); }

    // Returns |key| with uniform casing if it's a string, or the actual object unchanged for any
    // other kind of data type.
    uniformCasing(key) {
        if (typeof key === 'string')
            return key.toLowerCase();

        return key;
    }
}
