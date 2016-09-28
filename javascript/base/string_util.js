// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Returns whether the value of a string can be interpret as a safe integer.
String.prototype.isSafeInteger = function() {
    return this.toSafeInteger() !== null;
};

// Returns the integral value of a string. Returns NULL when it's not a safe integer.
String.prototype.toSafeInteger = function() {
    const value = parseFloat(this);
    if (Number.isNaN(value) || !Number.isSafeInteger(value))
        return null;

    return value;
};

// Returns whether the value of a string can be interpret as a number.
String.prototype.isNumber = function() {
    return this.toNumber() !== null;
};

// Returns the number value of a string. Returns NULL when it's not a number.
String.prototype.toNumber = function() {
    const value = parseFloat(this);
    if (Number.isNaN(value) || !Number.isFinite(value))
        return null;

    return value;
};
