// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

require('base/timers.js');

let Playground = require('playground.js');

// TODO(Russell): Execute the test runner, and refuse to start up the Playground
// object if there are any test failures. We need some kind of directory
// scanning functionality for this (**/*.test.js).

new Playground();  // instantiate the world
