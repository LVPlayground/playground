// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Assert = require('base/test/assert.js'),
    AssertionFailedError = require('base/test/assertion_failed_error.js'),
    UnexpectedExceptionError = require('base/test/unexpected_exception_error.js');

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
      let test = this.tests_[i];

      yield new Promise(resolve => {
        // (1) Execute the beforeEach function, which will be considered asynchronous if it returns
        // a promise. Otherwise resolve the preparation step immediately.
        if (this.beforeEach_)
          resolve(this.beforeEach_());
        else
          resolve();
      }).then((f) => {
        // (2) Execute the test case itself. This will be considered asynchronous if it returns a
        // promise. A new Assert instance will be created for each test.
        return test.fn(new Assert(this, test.description));
      }).catch(error => {
        // (2b) If the test threw an exception that's different from an AssertionFailedError, it's
        // a problem outside of the test framework that should be displayed consistently.
        if (!(error instanceof AssertionFailedError)) {
          error = new UnexpectedExceptionError({ suiteDescription: this.description_,
                                                 testDescription: test.description,
                                                 innerError: error });
        }

        // Re-throw the error since it should still count as a failure.
        throw error;

      }).then(() => {
        // (3) Execute the afterEach function, which, as the other steps, will be considered
        // asynchronous when it returns a promise.
        if (this.afterEach_)
          return this.afterEach_();
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

exports = TestSuite;
