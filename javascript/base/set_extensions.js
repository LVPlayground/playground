// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Polyfill implementation for some of the new Set extensions:
// https://github.com/tc39/proposal-set-methods

// Set.prototype.difference(iterable) - creates new Set without elements present in iterable.
export function difference(left, right) {
    const result = new Set();

    for (const value of left) {
        if (!right.has(value))
            result.add(value);
    }

    return result;
}

// Set.prototype.intersection(iterable) - creates new Set instance by set intersection operation.
export function intersect(left, right) {
    const result = new Set();

    for (const value of left) {
        if (right.has(value))
            result.add(value);
    }

    return result;
}

// Set.prototype.symmetricDifference(iterable) - Set of elements found only in either of the sets.
export function symmetricDifference(left, right) {
    const result = new Set();

    for (const value of left) {
        if (!right.has(value))
            result.add(value);
    }

    for (const value of right) {
        if (!left.has(value))
            result.add(value);
    }

    return result;
}

// Set.prototype.union(iterable) - creates new Set instance by set union operation.
export function union(left, right) {
    const result = new Set();

    for (const value of left)
        result.add(value);
    
    for (const value of right)
        result.add(value);
    
    return result;
}
