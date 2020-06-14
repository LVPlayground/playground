// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The TestError is the base class for all errors that will be thrown as a consequence of the test
// framework. It provides the infrastructure required to identify the failing test.
export class TestError extends Error {
  constructor(context) {
    super();

    const stackTrace = context.innerError.stack.split('\n');
    const stackLength = stackTrace.length;

    let filename = 'unknown';
    let line = 0;

    // TODO(Russell): Become much smarter about finding the file and line to blame...
    {
      for (let i = stackLength - 1; i >= 0; --i) {
        const stackLine = stackTrace[i];
        if (!stackLine.includes('javascript'))
          continue;  // doesn't contain a filename

        if (!stackLine.includes('.test.'))
          continue;  // doesn't include a test file

        [, filename, line] = stackLine.match(/javascript[\\\/]([^:]+):(\d+):/);
      }
    }

    this.context_ = {
      suiteDescription: context.suiteDescription,
      testDescription: context.testDescription,
      filename: filename,
      line: line
    };

    this.name = new.target.name;
    this.message = '';
  }

  // Creates a string having the file, line and test that caused a test to fail. This method assumes
  // that the input information to the TestError was correct.
  toString() {
    return '[' + this.context_.filename + ':' + this.context_.line + '] ' +
           this.context_.suiteDescription + ' ' + this.context_.testDescription;
  }
};
