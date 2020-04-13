// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Assert from 'base/test/assert.js';
import AssertionFailedError from 'base/test/assertion_failed_error.js';
import MockServer from 'mock_server.js';
import UnexpectedExceptionError from 'base/test/unexpected_exception_error.js';

// A test suite represents a series of one or more individual tests. The test suite not only
// registers individual tests and suite capabilities, but also provides the required functionality
// to asynchronously execute the test suites.
class TestSuite {
  constructor(description, fn) {
    this.description_ = description;
    this.tests_ = [];

    this.beforeEach_ = null;
    this.afterEach_ = null;

    // Call the test descriptor that contains the individual test cases.
    fn(
        /** it **/         TestSuite.prototype.registerTest.bind(this),
        /** beforeEach **/ TestSuite.prototype.setBeforeEach.bind(this),
        /** afterEach **/  TestSuite.prototype.setAfterEach.bind(this));
  }

  // Returns the description of this test suite.
  get description() { return this.description_; }

  // Returns the number of tests that are part of this suite.
  get testCount() { return this.tests_.length; }

  // JavaScript generator function that yields a promise for each test that is about to be executed.
  // This enables us to run tests sequentially rather than in parallel, which will significantly
  // decrease confusion and issues when people write tests.
  *executeTestGenerator() {
    for (let i = 0; i < this.tests_.length; ++i) {
      const test = this.tests_[i];

      const assert = new Assert(this, test.description);
      const originalServer = global.server;

      let carriedException = null;

      yield Promise.resolve().then(() => {
        // (1) Install the MockServer as the global `server` object.
        global.server = new MockServer();

        // (2) Execute the beforeEach function, which will be considered asynchronous if it returns
        // a promise. Otherwise resolve the preparation step immediately.
        if (this.beforeEach_)
          return this.beforeEach_(assert);

      }).then(() => {
        // (3) Execute the test case itself. This will be considered asynchronous if it returns a
        // promise. A new Assert instance will be created for each test.
        return test.fn(assert);

      }).catch(error => {
        // (3b) If the test threw an exception that's different from an AssertionFailedError, it's
        // a problem outside of the test framework that should be displayed consistently.
        if (!(error instanceof AssertionFailedError)) {
          error = new UnexpectedExceptionError({ suiteDescription: this.description_,
                                                 testDescription: test.description,
                                                 innerError: error });
        }

        // Re-throw the error after executing afterEach(), since it should still count as a failure.
        carriedException = error;

      }).then(() => {
        // (4) Execute the afterEach function, which, as the other steps, will be considered
        // asynchronous when it returns a promise.
        if (this.afterEach_)
          return this.afterEach_(assert);

      }).catch(error => {
        // (5) If the afterEach() method threw an exception, store this in |carriedException| unless
        // the test body itself already threw an exception.
        if (carriedException === null)
          carriedException = error;

      }).then(() => {
        // (6) Dispose the global mocked server, and re-instate the original instance. This may
        // throw because the feature can have interacted with one of the managers.
        return global.server.dispose();

      }).catch(error => {
        // (7) If disposing of the environment threw an exception, store this in |carriedException|
        // unless the test body itself already threw an exception.
        if (carriedException === null)
          carriedException = error;

      }).then(() => {
        // (8) Restore the original value of the |server| global.
        global.server = originalServer;

        // (9) If an exception was thrown, either in the test body, or in the afterEach() method,
        // rethrow it now so that this test will be marked as flaky.
        if (carriedException !== null)
          throw carriedException;
      });
    }
  }

  // Registers the test described with |description|, and implemented by |fn|. It will not yet be
  // executed as part of this call, it will only be registered.
  registerTest(description, fn) {
    this.tests_.push({ description, fn });
  }

  // Sets |fn| as the function that is to be executed before each individual test. Only a single
  // function may be registered for this purpose.
  setBeforeEach(fn) {
    if (this.beforeEach_ !== null)
      throw new Error('Only a single beforeEach function may be registered per test suite.');

    this.beforeEach_ = fn;
  }

  // Sets |fn| as the function that is to be executed after each individual test. Only a single
  // function may be registered for this purpose.
  setAfterEach(fn) {
    if (this.afterEach_ !== null)
      throw new Error('Only a single afterEach function may be registered per test suite.');

    this.afterEach_ = fn;
  }

};

export default TestSuite;
