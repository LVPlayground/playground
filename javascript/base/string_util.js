// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Returns whether the value of a string can be interpret as a safe integer.
export function isSafeInteger(value) {
    return toSafeInteger(value) !== null;
}

// Returns the integral value of a string. Returns NULL when it's not a safe integer.
export function toSafeInteger(value) {
    const floatValue = parseFloat(value);
    if (Number.isNaN(floatValue) || !Number.isSafeInteger(floatValue))
        return null;

    return floatValue;
}
