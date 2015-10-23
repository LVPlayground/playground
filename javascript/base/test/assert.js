// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let AssertionFailedError = require('base/test/assertion_failed_error.js');

// This library provides a series of asserts that can be used for validating assumptions in unit
// tests. Failing asserts will create clear and useful error messages.
//
// This library implements the Chai assertion API, as documented here:
//     http://chaijs.com/api/assert/
class Assert {
  constructor(suite, description) {
    this.suite_ = suite;
    this.description_ = description;
  }

  // -----------------------------------------------------------------------------------------------

  // Asserts |actual| == |expected|.
  equal(actual, expected) {
    if (actual == expected)
      return;

    this.reportFailure('expected ' + this.toString(expected) + ', but got ' + this.toString(actual));
  }

  // Asserts |actual| != |expected|.
  notEqual(actual, expected) {
    if (actual != expected)
      return;

    this.reportFailure('unexpectedly equals ' + this.toString(expected));
  }

  // Asserts |actual| === |expected|.
  strictEqual(actual, expected) {
    if (actual === expected)
      return;

    this.reportFailure('expected ' + this.toString(expected) + ', but got ' + this.toString(actual));
  }

  // Asserts |actual| !== |expected|.
  notStrictEqual(actual, expected) {
    if (actual !== expected)
      return;

    this.reportFailure('unexpectedly equals ' + this.toString(expected));
  }

  // Asserts |value| == true.
  isTrue(value) {
    if (value)
      return;

    this.reportFailure('evaluates to false');
  }

  // Asserts |value| == false.
  isFalse(value) {
    if (!value)
      return;

    this.reportFailure('evaluates to true');
  }

  // Asserts |value| === null.
  isNull(value) {
    if (value === null)
      return;

    this.reportFailure('expected NULL, but got ' + this.toString(value));
  }

  // Asserts |value| !== null.
  isNotNull(value) {
    if (value !== null)
      return;

    this.reportFailure('evaluates to NULL');
  }

  // Asserts |value| === undefined.
  isUndefined(value) {
    if (value === undefined)
      return;

    this.reportFailure('expected undefined, but got ' + this.toString(value));
  }

  // Asserts |value| !== undefined.
  isDefined(value) {
    if (value !== undefined)
      return;

    this.reportFailure('evaluates to undefined');
  }

  // Asserts typeof |value| === "function".
  isFunction(value) {
    if (typeof value === "function")
      return;

    this.reportFailure('expected a function, but got ' + this.toString(value));
  }

  // Asserts typeof |value| !== "function".
  isNotFunction(value) {
    if (typeof value !== "function")
      return;

    this.reportFailure('evaluates to a function');
  }

  // Asserts typeof |value| === "object" && !Array.isArray(|value|).
  isObject(value) {
    if (typeof value === "object" && !Array.isArray(value))
      return;

    this.reportFailure('expected an object, but got ' + this.toString(value));
  }

  // Asserts typeof |value| !== "function".
  isNotObject(value) {
    if (typeof value !== "object" || Array.isArray(value))
      return;

    this.reportFailure('evaluates to an object');
  }

  // Asserts Array.isArray(value).
  isArray(value) {
    if (Array.isArray(value))
      return;

    this.reportFailure('expected an array, but got ' + this.toString(value));
  }

  // !Asserts Array.isArray(value).
  isNotArray(value) {
    if (!Array.isArray(value))
      return;

    this.reportFailure('evaluates to an array');
  }

  // Asserts typeof |value| === "string".
  isString(value) {
    if (typeof value === "string")
      return;

    this.reportFailure('expected a string, but got ' + this.toString(value));
  }

  // Asserts typeof |value| !== "string".
  isNotString(value) {
    if (typeof value !== "string")
      return;

    this.reportFailure('evaluates to a string');
  }

  // Asserts typeof |value| === "number".
  isNumber(value) {
    if (typeof value === "number")
      return;

    this.reportFailure('expected a number, but got ' + this.toString(value));
  }

  // Asserts typeof |value| !== "number".
  isNotNumber(value) {
    if (typeof value !== "number")
      return;

    this.reportFailure('evaluates to a number');
  }

  // Asserts typeof |value| === "boolean".
  isBoolean(value) {
    if (typeof value === "boolean")
      return;

    this.reportFailure('expected a boolean, but got ' + this.toString(value));
  }

  // Asserts typeof |value| !== "boolean".
  isNotBoolean(value) {
    if (typeof value !== "boolean")
      return;

    this.reportFailure('evaluates to a boolean');
  }

  // -----------------------------------------------------------------------------------------------

  // Coerces |value| to a string. 
  toString(value) {
    return value.toString();
  }

  // Reports |failure| by throwing an AssertionFailedError. This method should only be called by
  // methods within this class, tests should use the exposed assertions instead.
  reportFailure(message) {
    throw new AssertionFailedError({ suiteDescription: this.suite_.description,
                                     testDescription: this.description_,
                                     innerError: new Error() },
                                   message);
  }
};

exports = Assert;
