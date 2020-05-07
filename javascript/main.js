// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Server from 'server.js';
import TestRunner from 'base/test/test_runner.js';

// Import global objects.
import 'base/color.js';
import 'base/message.js';
import 'base/rect.js';
import 'base/string_util.js';
import 'base/time.js';
import 'base/vector.js';

// Import the entities. These are global objects.
import 'entities/actor.js';
import 'entities/game_object.js';
import 'entities/npc.js';
import 'entities/pickup.js';
import 'entities/player.js';
import 'entities/text_label.js';
import 'entities/vehicle.js';
import 'entities/vehicle_model.js';
import 'entities/virtual_world.js';

// All tests included in the JavaScript version of Las Venturas Playground must pass before we allow
// the gamemode to be started. Without this requirement, certain features may break unexpectedly.
const testRunner = new TestRunner();

testRunner.run('.*\.test\.js').then(time => {
    console.log('Passed all ' + testRunner.testCount + ' tests in ' + time + 'ms!');

    notifyReady();  // allow the SA-MP server to start accepting connections

    server = new Server();
    server.featureManager.loadFeatures([
        // Foundational features. These must not have dependencies on any other features.
        'nuwani',

        // Low level features, which may only depend on each other and foundational features.
        'abuse', 'announce', 'communication', 'economy', 'finance', 'location', 'logger', 'minigames',
        'settings', 'streamer',

        // Gang-related features
        'gang_chat', 'gang_zones', 'gangs',

        // House-related features
        'houses',

        // General smaller, self-contained features
        'friends', 'killtime', 'nuwani_commands', 'playground', 'punishments', 'radio', 'report', 'vehicles',

        // Player-related features
        'account', 'player_favours',

        // -----------------------------------------------------------------------------------------

        // v1 features - these need to be cleaned up
        'activity_log', 'commands', 'death_feed', 'debug', 'races'
    ]);

}, failures => {
    // One or more tests have failed. Refuse to start the gamemode.
    console.log('==============================================================');
    console.log('There were one or more test failures. Please fix them before starting the server!\n');

    failures.forEach(failure =>
        console.log('  ' + failure.toString() + '\n'));

    console.log('==============================================================\n');

    // Kill the server for easier debugging on Windows.
    killServer();
});
