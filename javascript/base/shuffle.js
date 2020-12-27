// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { random } from 'base/random.js';

// Shuffles the given |value| with the Fisher-Yates algorithm. Any iterable value is supported,
// although recomposition is limited to arrays (default), strings, Set and Map. The given |value|
// will not be modified, although each of its values will not be cloned.
//
// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
export function shuffle(value) {
    if (!isIterable(value))
        throw new Error('Only iterable values can be shuffled.');

    const values = [ ...value ];
    let counter = values.length;

    while (counter > 0) {
        const index = random(counter--);
        const temp = values[counter];

        values[counter] = values[index];
        values[index] = temp;
    }

    // Specializations for returning shuffled data in particular data types.
    switch (Object.prototype.toString.call(value)) {
        case '[object Map]':
            return new Map(values);

        case '[object Set]':
            return new Set(values);

        case '[object String]':
            return values.join('');
    }

    // Default to returning the |values| as an array.
    return values;
}

// Returns whether the given |value| is iterable.
function isIterable(value) {
    return value !== null && typeof value[Symbol.iterator] === 'function';
}
