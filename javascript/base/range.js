// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The longest sensible range this function will issue. After this an exception will be thrown.
const kLongestSensibleRange = 1000000;

// Generates an array with integers from the |start| to the |end|, optionally taking the |step|.
// Mimics the Python `range()` function: https://docs.python.org/library/functions.html#range
//
// Will go backwards if the |end| comes before the |start|.
//
// Valid usages:
//   range(end)
//   range(start, end)
//   range(start, end, step)
//
export function range(start, end, step) {
    if (end === undefined) {
        end = start ?? 0;
        start = 0;
    }

    if (step === undefined)
        step = end < start ? -1 : 1;
    
    if (typeof start !== 'number')
        throw new Error(`The range's start (${start}) must be a number.`);
    if (typeof end !== 'number')
        throw new Error(`The range's end (${end}) must be a number.`);
    if (typeof step !== 'number')
        throw new Error(`The range's step (${step}) must be a number.`);

    const length = Math.max(Math.ceil((end - start) / step), 0);
    if (length > kLongestSensibleRange)
        throw new Error(`Cannot create a range of ${length} entries.`);

    const result = Array(length);

    for (let i = 0; i < length; ++i, start += step)
        result[i] = start;
    
    return result;
}
