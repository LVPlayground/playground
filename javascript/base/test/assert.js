// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let AssertionFailedError = require('base/test/assertion_failed_error.js');

// This library provides a series of asserts that can be used for validating assumptions in unit
// tests. Failing asserts will create clear and useful error messages.
class Assert {
  constructor(suite, description) {
    this.suite_ = suite;
    this.description_ = description;
  }

  // -----------------------------------------------------------------------------------------------

  // Asserts |expected| == |actual|.
  equals(expected, actual) {
    if (expected == actual)
      return;

    this.reportFailure('expected "' + expected + '", but got "' + actual + '"');
  }

  // -----------------------------------------------------------------------------------------------

  // Reports |failure| by throwing an AssertionFailedError. This method should only be called by
  // methods within this class, tests should use the exposed assertions instead.
  reportFailure(message) {
    throw new AssertionFailedError(this.suite_.description, this.description_, message);
  }
};

exports = Assert;
