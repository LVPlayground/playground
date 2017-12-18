// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The TestError is the base class for all errors that will be thrown as a consequence of the test
// framework. It provides the infrastructure required to identify the failing test.
class TestError extends Error {
  constructor(context) {
    super();

    let stackTrace = context.innerError.stack.split('\n'),
        stackLength = stackTrace.length;

    // Determine the location of the error based on the second-final entry in the stack trace.
    let [_, filename, line] = stackTrace[stackLength - 1].match(/.*\(([^:]+):(\d+):.*/);

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

export default TestError;
