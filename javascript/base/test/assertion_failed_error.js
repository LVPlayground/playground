// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { TestError } from 'base/test/test_error.js';

// The AssertionFailedError will be thrown when an assertion that's part of a test suite has failed.
// The |message| will contain detailed information about what went wrong.
export class AssertionFailedError extends TestError {
  constructor(context, message) {
    super(context);

    this.message = message;
  }

  // Converts the error to a readable message.
  toString() {
    return super.toString() + ': ' + this.message;
  }
};
