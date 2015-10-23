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
    if (expected == actual)
      return;

    this.reportFailure('expected "' + expected + '", but got "' + actual + '"');
  }

  // -----------------------------------------------------------------------------------------------

  // Reports |failure| by throwing an AssertionFailedError. This method should only be called by
  // methods within this class, tests should use the exposed assertions instead. It will determine
  // the filename and the line of the test that threw the error, and include it for the exception.
  reportFailure(message) {
    let stackTrace = new Error().stack.split('\n'),
        [_, filename, line] = stackTrace[3].match(/.*\(([^:]+):(\d+):.*/);

    throw new AssertionFailedError({ suiteDescription: this.suite_.description,
                                     testDescription: this.description_,
                                     filename: filename,
                                     line: line },
                                   message);
  }
};

exports = Assert;
