// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('PlaygroundCommands', (it, beforeEach) => {
    let commands = null;
    let gunther = null;

    beforeEach(async () => {
        const feature = server.featureManager.loadFeature('player_commands');

        commands = feature.commands_;

        gunther = server.playerManager.getById(0 /* Gunther */);
        await gunther.identify();
    });

    it('should register spawnweapons command', async assert => {
        assert.isTrue(await gunther.issueCommand('/my spawnweapons 1337 1'));
    });

    it('should register p spawnweapons command', async assert => {
        gunther.level = Player.LEVEL_ADMINISTRATOR;
        assert.isTrue(await gunther.issueCommand('/p 0 spawnweapons 1337 1'));
    });

    it('should pawninvoke unknown my command', async assert => {
        assert.isTrue(await gunther.issueCommand('/my somerandom test command'));
    });

    it('should pawninvoke unknown p command', async assert => {
        gunther.level = Player.LEVEL_ADMINISTRATOR;
        assert.isTrue(await gunther.issueCommand('/p somerandom test command'));
    });

    it('should pawninvoke unknown p command', async assert => {
        gunther.level = Player.LEVEL_ADMINISTRATOR;
        assert.isTrue(await gunther.issueCommand('/p 1'));
    });

    it('should pawninvoke unknown p command', async assert => {
        gunther.level = Player.LEVEL_ADMINISTRATOR;
        assert.isTrue(await gunther.issueCommand('/p 1 test more test'));
    });

});
