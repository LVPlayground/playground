// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('PlayerCommandRegistry', (it, beforeEach) => {
    let registry = null;

    beforeEach(async () => {
        const feature = server.featureManager.loadFeature('player_commands');

        registry = feature.registry_;

        // If this line throws an exception, then there's an import error with one of the commands
        // that's being dynamically imported. Read the exception message, and off you go.
        await registry.initialize();
    });

    it('should expose the /my and /p commands to the server', assert => {
        assert.isTrue(server.commandManager.hasCommand('my'));
        assert.isTrue(server.commandManager.hasCommand('p'));
    });
});
