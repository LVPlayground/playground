// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Server = require('server.js');
const TestRunner = require('base/test/test_runner.js');

// Import global objects.
require('base/color.js');
require('base/message.js');
require('base/number_util.js');
require('base/rect.js');
require('base/string_util.js');
require('base/time.js');
require('base/vector.js');

// Import the entities. These are global objects.
require('entities/actor.js');
require('entities/game_object.js');
require('entities/pickup.js');
require('entities/player.js');
require('entities/text_label.js');
require('entities/vehicle.js');
require('entities/vehicle_model.js');
require('entities/virtual_world.js');

// All tests included in the JavaScript version of Las Venturas Playground must pass before we allow
// the gamemode to be started. Without this requirement, certain features may break unexpectedly.
const testRunner = new TestRunner();

testRunner.run('.*\.test\.js').then(notifyReady).then(() => {
    console.log('Passed all ' + testRunner.testCount + ' tests!');

    server = new Server();
    server.featureManager.loadFeatures([
        // Foundational features
        'abuse', 'announce', 'communication', 'economy', 'location', 'logger', 'minigames',
        'settings', 'streamer',

        // Gang-related features
        'gang_chat', 'gangs',

        // House-related features
        'houses',

        // General smaller, self-contained features
        'friends', /*'killtime',*/ 'playground', 'report', 'vehicles',

        // Player-related features
        'player_favours',

        // VIP-related features
        'vips',

        // -----------------------------------------------------------------------------------------

        // v1 features - these need to be cleaned up
        'activity_log', 'commands', 'death_feed', 'debug', 'races'
    ]);

}, failures => {
    // One or more tests have failed. Refuse to start the gamemode.
    console.log('===============================================================');
    console.log('There were one or more test failures. Please fix them before starting the server!\n');

    failures.forEach(failure =>
        console.log('  ' + failure.toString() + '\n'));

    console.log('===============================================================\n');
});
