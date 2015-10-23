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

  // Asserts |value| === null
  isNull(value) {
    if (value === null)
      return;

    this.reportFailure('expected NULL, but got ' + this.toString(value));
  }

  // Asserts |value| !== null
  isNotNull(value) {
    if (value !== null)
      return;

    this.reportFailure('evaluates to NULL');
  }

  // Asserts |value| === undefined
  isUndefined(value) {
    if (value === undefined)
      return;

    this.reportFailure('expected undefined, but got ' + this.toString(value));
  }

  // Asserts |value| !== undefined
  isDefined(value) {
    if (value !== undefined)
      return;

    this.reportFailure('evaluates to undefined');
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
