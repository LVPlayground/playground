// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { TestError } from 'base/test/test_error.js';

// Error thrown when an unexpected exception occurs while running a test. The inner error will be
// displayed to the developer in total, while the TestError information will be fulfiled as well.
export class UnexpectedExceptionError extends TestError {
  constructor(context) {
    super(context);

    this.error_ = context.innerError;
    this.message = context.innerError.toString();
  }

  // Converts the error to a readable message. The TextError prefix will be used, appended with the
  // stack trace of the inner exception.
  toString() {
    return super.toString() + ': unexpected exception\n\n' + this.error_.stack;
  }
};
