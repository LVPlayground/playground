// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Server } from 'server.js';
import { TestRunner } from 'base/test/test_runner.js';

// Import global objects.
import 'base/color.js';
import 'base/message.js';
import 'base/vector.js';

// Import the entities. These are global objects.
import 'entities/player.js';
import 'entities/vehicle.js';

// All tests included in the JavaScript version of Las Venturas Playground must pass before we allow
// the gamemode to be started. Without this requirement, certain features may break unexpectedly.
const testRunner = new TestRunner();

testRunner.run('.*\.test\.js').then(time => {
    console.log('Passed all ' + testRunner.testCount + ' tests in ' + time + 'ms!');

    gc();  // force a garbage collection cycle
    
    notifyReady();  // allow the SA-MP server to start accepting connections

    server = new Server();
    server.initialize();

    server.featureManager.loadFeatures([
        // -----------------------------------------------------------------------------------------
        // Foundational features.
        //
        // These features provide critical functionality. They may not depend on other features
        // except for the other foundational features, without circular dependencies.
        // -----------------------------------------------------------------------------------------

        'account_provider',
        'communication',
        'finance',
        'instrumentation',
        'limits',
        'nuwani',
        'player_colors',
        'player_stats',
        'sampcac',
        'settings',

        // -----------------------------------------------------------------------------------------
        // Low-level features.
        //
        // May only depend on each other and foundational features, and are expected to be depended
        // on by various other features because of the functionality they provide.
        // -----------------------------------------------------------------------------------------

        'abuse',
        'announce',
        'collectables',
        'games',
        'games_deathmatch',
        'games_vehicles',
        'player_decorations',
        'spectate',
        'streamer',

        // -----------------------------------------------------------------------------------------
        // Regular features
        // -----------------------------------------------------------------------------------------

        // Low level features, which may only depend on each other and foundational features.
        'economy', 'location',

        // Gang-related features
        'gang_chat', 'gang_zones', 'gangs',

        // House-related features
        'houses',

        // General smaller, self-contained features
        'death_match', 'decorations', 'friends', 'killtime', 'nuwani_commands', 'playground',
        'punishments', 'radio', 'report', 'vehicles',

        // Player-related features
        'account', 'animations', 'player_commands', 'player_favours', 'player_settings', 
        'leaderboard', 'spawn_armour', 'teleportation',

        // -----------------------------------------------------------------------------------------
        // Regular features: Communication
        // -----------------------------------------------------------------------------------------

        'communication_commands',
        'gunther',
        'nuwani_discord',
        'reaction_tests',

        // -----------------------------------------------------------------------------------------
        // Regular features: Gameplay
        // -----------------------------------------------------------------------------------------

        'pirate_ship',

        // -----------------------------------------------------------------------------------------
        // Regular features: Games and minigames
        // -----------------------------------------------------------------------------------------

        'derbies',
        'fights',
        'haystack',
        'races',

        // -----------------------------------------------------------------------------------------

        // v1 features - these need to be cleaned up
        'activity_log', 'commands', 'death_feed', 'debug',
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
