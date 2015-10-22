// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Assert = require('base/test/assert.js');

// The test runner class manages execution of tests before the gamemode starts.
//
// When running tests, a Mocha-like test framework will be installed on the global scope for the
// duration of running the tests. Test suites can be defined with the describe() method, whereas
// individual test cases can be defined with the it() method. Both methods take a textual
// description as their first argument, and a JavaScript function as their second argument.
//
// A typical test suite could look like the following:
//
// describe('MyFeature', it => {
//   it('Should be the answer to life the universe and everything.', assert => {
//     assert.equals(42, calculateTheAnswer());
//   });
//
//   it('Should also be larger than fourty one.', assert => {
//     assert.greater
//   });
// });
//
// TODO(Russell): Support setUp and tearDown methods for test suites.
//
// Asynchronous tests are supported by returning a promise from the test function passed to it().
// Tests returning anything that's not a promise will be considered synchronous.
//
// Las Venturas Playground will only be allowed to run when *ALL* tests included in the JavaScript
// part of the gamemode pass. Running the gamemode while there is broken functionality will lead to
// unexpected results, and major inconvenience for players.
class TestRunner {
  constructor() {
    this.testCount_ = 0;
    this.testSuites_ = [];
  }

  // Returns the number of tests that have been executed by the test runner.
  get testCount() { return this.testCount_; }

  // Requires all files that match |pattern| so that tests defined in them can be created, and then
  // executed. Returns a promise that will be resolved when all tests pass, or rejected when one or
  // more failures are observed.
  run(pattern) {
    this.loadTestSuites(pattern);
    
    let testSuitePromises = [];
    this.testSuites_.forEach(suite =>
        testSuitePromises.push(this.executeSuite(suite)));
    
    return Promise.all(testSuitePromises);
  }

  // Registers the test suite |fn| described by |description|.
  createSuite(description, fn) {
    this.testSuites_.push({ description, fn });
  }

  // Executes |suite|, and returns a promise that will be resolved when execution of the test suite
  // is complete. Failures will cause it to reject, which will cascade all the way down.
  executeSuite(suite) {
    let testCases = [];

    // Collect the test cases available in the |suite|. In the future we'll want to pass further
    // utility methods here such as setUp() and tearDown() methods.
    suite.fn(
        /** it: **/ (description, test) => this.executeTest(suite, description, test));

    return Promise.all(testCases);
  }

  // Executes |test| that's part of |suite|, described by |description|. Returns a promise that will
  // resolve once the test is done executing, or reject is an assertion failed.
  executeTest(suite, description, test) {
    let assert = new Assert(suite, description);
    this.testCount_++;

    return new Promise(resolve => resolve(test(assert)));
  }

  // Loads all the test suites that match |pattern|. A global function called `describe` will be
  // made available to these files, enabling them to register their test suite(s).
  loadTestSuites(pattern) {
    // Install the global `describe` function on the global.
    global.describe = TestRunner.prototype.createSuite.bind(this);

    // TODO(Russell): Actually use |pattern|. This requires file globbing functionality within the
    // plugin, which doesn't exist yet.
    {
      require('base/priority_queue.test.js');
    }

    // Remove the `describe` method from the global scope again.
    delete global.describe;
  }
};

exports = TestRunner;
