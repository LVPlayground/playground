// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import MockPlaygroundCommands from 'features/playground/test/mock_playground_commands.js';

describe('Isolate', (it, beforeEach, afterEach) => {
    let commands = null;
    let gunther = null;
    let russell = null;

    beforeEach(async() => {
        commands = new MockPlaygroundCommands();
        await commands.loadCommands();

        gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify();

        russell = server.playerManager.getById(1 /* Russell */);
        russell.identify();
        russell.level = Player.LEVEL_MANAGEMENT;
    });

    afterEach(() => commands.dispose());

    it('should be able to isolate players', async assert => {
        gunther.virtualWorld = 10;
        assert.isFalse(gunther.syncedData.isIsolated());
        assert.equal(gunther.virtualWorld, 10);

        await russell.issueCommand('/isolate ' + gunther.name);

        assert.isTrue(gunther.syncedData.isIsolated());
        assert.equal(gunther.virtualWorld, 10);

        gunther.virtualWorld = 20;
        assert.equal(gunther.virtualWorld, 10);

        assert.equal(russell.messages.length, 3);
        assert.equal(gunther.messages.length, 0);

        russell.clearMessages();

        await russell.issueCommand('/isolate ' + gunther.name);

        assert.equal(russell.messages.length, 1);
        assert.isTrue(russell.messages[0].includes('already isolated'));

        assert.isFalse(russell.syncedData.isIsolated());
        assert.isTrue(gunther.syncedData.isIsolated());
    });
});
