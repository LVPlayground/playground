// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const NAME = 'AssertionFailedError';

// The AssertionFailedError will be thrown when an assertion that's part of a test suite has failed.
// The |message| will contain detailed information about what went wrong.
class AssertionFailedError extends Error {
  constructor(suiteDescription, testDescription, message) {
    super(message);

    this.name = NAME;

    this.suiteDescription_ = suiteDescription;
    this.testDescription_ = testDescription;
    this.message = message;
  }

  // Converts the error to a readable message.
  // TODO(Russell): Include the filename and line number of the failure with this message.
  toString() {
    return this.suiteDescription_ + ', it ' + this.testDescription_ + ': ' + this.message;
  }
};

exports = AssertionFailedError;
