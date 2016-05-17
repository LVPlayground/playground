// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Server = require('server.js');
const TestRunner = require('base/test/test_runner.js');

// Import global objects.
require('base/color.js');
require('base/message.js');

// Import the entities. These are global objects.
require('entities/actor.js');
require('entities/game_object.js');
require('entities/player.js');
require('entities/vehicle.js');
require('entities/virtual_world.js');

// All tests included in the JavaScript version of Las Venturas Playground must pass before we allow
// the gamemode to be started. Without this requirement, certain features may break unexpectedly.
const testRunner = new TestRunner();

testRunner.run('**/*.test.js').then(() => {
    console.log('Passed all ' + testRunner.testCount + ' tests!');

    server = new Server();
    server.featureManager.load({
        // Foundational features
        announce:       require('features/announce/announce.js'),
        communication:  require('features/communication/communication.js'),
        minigames:      require('features/minigames/minigames.js'),

        // Gang-related features
        gangChat:       require('features/gang_chat/gang_chat.js'),
        gangs:          require('features/gangs/gangs.js'),

        // General smaller, self-contained features
        friends:        require('features/friends/friends.js'),
        playground:     require('features/playground/playground.js'),

        // Player-related features
        playerFavours:  require('features/player_favours/player_favours.js'),


        // v1 features - these need to be cleaned up
        activityLog:    require('features/activity_log/activity_log.js'),
        commands:       require('features/commands/commands_feature.js'),
        deathFeed:      require('features/death_feed/death_feed_feature.js'),
        debug:          require('features/debug/debug_feature.js'),
        races:          require('features/races/races.js')
    });

}, failures => {
    // One or more tests have failed. Refuse to start the gamemode.
    console.log('===============================================================');
    console.log('There were one or more test failures. Please fix them before starting the server!\n');

    failures.forEach(failure =>
        console.log('  ' + failure.toString() + '\n'));

    console.log('===============================================================\n');
});
