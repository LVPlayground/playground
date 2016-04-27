// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

require('base/color.js');
require('base/message.js');

require('entities/game_object.js');
require('entities/player.js');
require('entities/vehicle.js');
require('entities/virtual_world.js');

const Server = require('server.js');
const TestRunner = require('base/test/test_runner.js');

// All tests included in the JavaScript version of Las Venturas Playground must pass before we allow
// the gamemode to be started. Without this requirement, certain features may break unexpectedly.
let testRunner = new TestRunner();
testRunner.run('**/*.test.js').then(() => {
  // All tests passed, start the gamemode by instantiating the Playground object.
  console.log('Passed all ' + testRunner.testCount + ' tests!');

  server = new Server();
  server.featureManager.load({
    account:       require('features/account/account_feature.js'),
    activityLog:   require('features/activity_log/activity_log.js'),
    commands:      require('features/commands/commands_feature.js'),
    deathFeed:     require('features/death_feed/death_feed_feature.js'),
    debug:         require('features/debug/debug_feature.js'),
    friends:       require('features/friends/friends_feature.js'),
    gangs:         require('features/gangs/feature.js'),
    races:         require('features/races/race_feature.js')
  });

}, failures => {
  // One or more tests have failed. Refuse to start the gamemode.
  console.log('===============================================================');
  console.log('There were one or more test failures. Please fix them before starting the server!\n');
  failures.forEach(failure =>
      console.log('  ' + failure.toString() + '\n'));

  console.log('===============================================================\n');
});
