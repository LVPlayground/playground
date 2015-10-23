// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

require('base/timers.js');

let Playground = require('playground.js'),
    TestRunner = require('test_runner.js');

// All tests included in the JavaScript version of Las Venturas Playground must pass before we allow
// the gamemode to be started. Without this requirement, certain features may break unexpectedly.
let testRunner = new TestRunner();
testRunner.run('**/*.test.js').then(() => {
  // All tests passed, start the gamemode by instantiating the Playground object.
  console.log('[PlaygroundJS] Passed all ' + testRunner.testCount + ' tests!');

  new Playground();

}, failures => {
  // One or more tests have failed. Refuse to start the gamemode.
  console.log('[PlaygroundJS] There were one or more test failures. Please fix them before starting the server!');
  console.log(failures);
});
