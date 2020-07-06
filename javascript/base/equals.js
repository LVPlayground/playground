// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Returns whether the given |value| and |other| variables are equal to each other.
export function equals(value, other) {
    const valueType = Object.prototype.toString.call(value);
    const otherType = Object.prototype.toString.call(other);

    if (valueType !== otherType)
        return false;  // the types are different

    switch (valueType) {
        case '[object Array]':
            return arrayEquals(value, other);

        case '[object Date]':
            return value.getTime() === other.getTime();

        case '[object Function]':
            return value.toString() === other.toString();

        case '[object Map]':
            return mapEquals(value, other);

        case '[object Number]':
            if (Number.isNaN(value) && Number.isNaN(other))
                return true;

            return value === other;

        case '[object Object]':
            return objectEquals(value, other);

        case '[object Set]':
            return setEquals(value, other);

        default:
            return value === other;
    }
}

// Returns whether the two arrays in |value| and |other| are equal to each other.
function arrayEquals(value, other) {
    if (value.length !== other.length)
        return false;  // the lengths are different

    for (let index = 0; index < value.length; ++index) {
        if (!equals(value[index], other[index]))
            return false;
    }

    return true;
}

// Returns whether the two maps in |value| and |other| are equal to each other. Because keys in
// maps are instance-based, we will do a strict comparison rather than a deep one.
function mapEquals(value, other) {
    if (value.size !== other.size)
        return false;  // different number of entries in the sets
    
    for (const [ key, entry ] of value) {
        if (!other.has(key))
            return false;
        
        if (!equals(entry, other.get(key)))
            return false;
    }

    return true;
}

// Returns whether the two objects in |value| and |other| are equal to each other.
function objectEquals(value, other) {
    const valueKeys = Object.keys(value);
    const otherKeys = Object.keys(other);

    if (valueKeys.length !== otherKeys.length)
        return false;  // the objects have different numbers of keys

    for (const key of valueKeys) {
        if (!other.hasOwnProperty(key))
            return false;  // the |key| is not found on |other|
        
        if (!equals(value[key], other[key]))
            return false;
    }

    return true;
}

// Returns whether the two sets in |value| and |other| are equal to each other.
function setEquals(value, other) {
    if (value.size !== other.size)
        return false;  // different number of entries in the sets
    
    for (const key of value) {
        if (!other.has(key))
            return false;
    }

    return true;
}
