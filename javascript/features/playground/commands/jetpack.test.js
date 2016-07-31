// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MockPlaygroundCommands = require('features/playground/test/mock_playground_commands.js');

describe('JetpackCommand', (it, beforeEach, afterEach) => {
    let commands = null;
    let gunther = null;

    beforeEach(() => {
        commands = new MockPlaygroundCommands();
        gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify();

        // Enable |gunther| to use the command by adding an exception.
        commands.access.addException('jetpack', gunther);
    });

    afterEach(() => commands.dispose());

    it('should disable jetpacks for players who are not in the main world', async(assert) => {
        const virtualWorld = 1337;  // any non-main world virtual world will do

        assert.isFalse(VirtualWorld.isMainWorld(virtualWorld));
        gunther.virtualWorld = virtualWorld;

        assert.isTrue(await gunther.issueCommand('/jetpack'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.LVP_JETPACK_NOT_AVAILABLE_VW);
        assert.equal(gunther.specialAction, Player.SPECIAL_ACTION_NONE);
    });

    it('should enable administrators to give a jetpack to another player', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);

        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(await gunther.issueCommand('/jetpack ' + russell.name));

        assert.equal(gunther.messages.length, 2);
        assert.equal(gunther.messages[0], Message.format(Message.LVP_JETPACK_GRANTED_OTHER,
                                                        russell.name, russell.id));

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], Message.format(Message.LVP_JETPACK_GRANTED, gunther.name,
                                                         gunther.id));

        assert.equal(russell.specialAction, Player.SPECIAL_ACTION_USEJETPACK);
    });

    it('should enable administrators to remove administrators from players', assert => {
        const russell = server.playerManager.getById(1 /* Russell */);
        russell.specialAction = Player.SPECIAL_ACTION_USEJETPACK;

        gunther.level = Player.LEVEL_ADMINISTRATOR;
        
        assert.isTrue(gunther.issueCommand('/jetpack ' + russell.name + ' remove'));

        assert.equal(gunther.messages.length, 2);
        assert.equal(gunther.messages[0], Message.format(Message.LVP_JETPACK_REMOVED_OTHER,
                                                        russell.name, russell.id));

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], Message.format(Message.LVP_JETPACK_REMOVED, gunther.name,
                                                         gunther.id));

        assert.equal(russell.specialAction, Player.SPECIAL_ACTION_NONE);
    });
});
