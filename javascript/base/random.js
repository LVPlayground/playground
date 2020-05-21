// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Returns a random number between [min, max]. For consistency with Pawn, if the |max| argument is
// omitted then the |min| will be used at the maximum instead, returning a number between [0, max].
export function random(min, max = null) {
    if (max === null) {
        if (min <= 0)
            throw new Error(`The boundary passed to random(max) may not be negative.`);

        max = min;
        min = 0;
    }

    return Math.floor(Math.random() * (max - min)) + min;
}
