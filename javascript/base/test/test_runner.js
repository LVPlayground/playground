// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let TestSuite = require('base/test/test_suite.js');

// The test runner class manages execution of tests before the gamemode starts.
//
// When running tests, a Mocha-like test framework will be installed on the global scope for the
// duration of running the tests. Test suites can be defined with the describe() method, whereas
// individual test cases can be defined with the it() method. Both methods take a textual
// description as their first argument, and a JavaScript function as their second argument.
//
// A typical test suite could look like the following:
//
// describe('MyFeature', (it, beforeEach, afterEach) => {
//   let controller = null;
//
//   beforeEach(() => controller = new MyFeature());
//   afterEach(() => { controller.close(); controller = null });
//
//   it('Should be the answer to life the universe and everything.', assert => {
//     assert.equal(controller.answer(), 42);
//   });
//
//   it('Should also be larger than fourty one.', assert => {
//     assert.isAbove(controller.answer(), 41);
//   });
// });
//
// Asynchronous tests are supported by returning a promise from the test function passed to it().
// Tests returning anything that's not a promise will be considered synchronous.
//
// Las Venturas Playground will only be allowed to run when *ALL* tests included in the JavaScript
// part of the gamemode pass. Running the gamemode while there is broken functionality will lead to
// unexpected results, and major inconvenience for players.
class TestRunner {
  constructor() {
    this.testSuites_ = [];
  }

  // Returns the number of tests that have been executed by the test runner.
  get testCount() {
    let count = 0;
    this.testSuites_.forEach(suite =>
        count += suite.testCount);

    return count;
  }

  // Requires all files that match |pattern| so that tests defined in them can be created, and then
  // executed. Returns a promise that will be resolved when all tests pass, or rejected when one or
  // more failures are observed.
  run(pattern) {
    this.loadTestSuites(pattern);

    return new Promise((resolve, reject) => {
      let currentSuiteIndex = 0,
          failures = [];

      let runNextSuite = () => {
        if (currentSuiteIndex >= this.testSuites_.length) {
          // Report to the test runner that running the tests has finished.
          reportTestsFinished(this.testCount, failures.length);

          // Either resolve or reject the promise based on the number of failing tests.
          failures.length > 0 ? reject(failures)
                              : resolve();
          return;
        }

        // Execute the test suite. Append all failures to the |failures| array, after which the
        // next suite may be executed by calling the runNextSuite() method again.
        this.executeTestSuite(this.testSuites_[currentSuiteIndex++])
            .catch(suiteFailures => failures.push(...suiteFailures))
            .then(() => runNextSuite());
      };

      runNextSuite();
    });
  }

  // Executes all tests in |suite| sequentially. Returns a promise that will be resolved when all
  // tests in the suite have passed, or rejected when one or more tests failed.
  executeTestSuite(suite) {
    return new Promise((resolve, reject) => {
      let generator = suite.executeTestGenerator(),
          failures = [];

      let runNextTest = () => {
        let test = generator.next();
        if (test.done) {
          failures.length > 0 ? reject(failures)
                              : resolve();
          return;
        }

        // Catch failures, but make them resolve the promise in either case so that the next test
        // can continue to run. Otherwise we'd abort at the first test failure.
        test.value.catch(error => failures.push(error))
                  .then(() => runNextTest());
      };

      runNextTest();
    });
  }

  // Registers the test suite |fn| described by |description|. The suite will be immediately
  // initialized by executing |fn| and registering the test cases part of it.
  registerSuite(description, fn) {
    this.testSuites_.push(new TestSuite(description, fn));
  }

  // Loads all the test suites that match |pattern|. A global function called `describe` will be
  // made available to these files, enabling them to register their test suite(s).
  loadTestSuites(pattern) {
    // Install the global `describe` function on the global.
    global.describe = TestRunner.prototype.registerSuite.bind(this);

    // TODO(Russell): Actually use |pattern|. This requires file globbing functionality within the
    // plugin, which doesn't exist yet.
    {
      require('base/color.test.js');
      require('base/extendable.test.js');
      require('base/message.test.js');
      require('base/priority_queue.test.js');
      require('base/scoped_callbacks.test.js');
      require('base/string_parser.test.js');
      require('base/test/assert.test.js');
      require('base/vector.test.js');
      require('components/command_manager/command_builder.test.js');
      require('components/database/database.test.js');
      require('components/dialogs/question.test.js');
      require('components/dialogs/question_sequence.test.js');
      require('components/feature_manager/dependency_graph.test.js');
      require('components/feature_manager/feature_manager.test.js');
      require('components/interior_selector/interior_selector.test.js');
      require('components/text_draw/text_draw.test.js');
      require('entities/player_manager.test.js');
      require('entities/scoped_entities.test.js');
      require('features/announce/announce_manager.test.js');
      require('features/communication/communication_manager.test.js');
      require('features/death_feed/death_feed_feature.test.js');
      require('features/friends/friends_commands.test.js');
      require('features/friends/friends_manager.test.js');
      require('features/gang_chat/gang_chat_manager.test.js');
      require('features/gangs/gang_commands.test.js');
      require('features/gangs/gang_manager.test.js');
      require('features/minigames/minigame_driver.test.js');
      require('features/minigames/minigame_manager.test.js');
      require('features/player_favours/object_remover.test.js');
      require('features/playground/playground_commands.test.js');
      require('features/races/drift_tracker.test.js');
      require('features/races/race_importer.test.js');
      require('features/vehicles/vehicle_commands.test.js');
      require('features/vehicles/vehicle_grid.test.js');
      require('features/vehicles/vehicle_manager.test.js');
      require('features/vehicles/vehicle_streamer.test.js');
    }

    // Remove the `describe` method from the global scope again.
    delete global.describe;
  }
};

exports = TestRunner;
