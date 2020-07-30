// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { VirtualWorld } from 'entities/virtual_world.js';

describe('JetpackCommand', (it, beforeEach) => {
    let gunther = null;

    beforeEach(async() => {
        const feature = server.featureManager.loadFeature('playground');
        await feature.commands_.loadCommands();

        gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        await gunther.identify();
    });

    it('should disable jetpacks for players who are not in the main world', async(assert) => {
        const virtualWorld = 1337;  // any non-main world virtual world will do

        assert.isFalse(VirtualWorld.isMainWorld(virtualWorld));
        gunther.virtualWorld = virtualWorld;

        assert.isTrue(await gunther.issueCommand('/jetpack'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.LVP_JETPACK_NOT_AVAILABLE_VW);
        assert.equal(gunther.specialAction, Player.kSpecialActionNone);
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

        assert.equal(russell.specialAction, Player.kSpecialActionJetpack);
    });

    it('should enable administrators to remove administrators from players', assert => {
        const russell = server.playerManager.getById(1 /* Russell */);
        russell.specialAction = Player.kSpecialActionJetpack;

        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(gunther.issueCommand('/jetpack ' + russell.name + ' remove'));

        assert.equal(gunther.messages.length, 2);
        assert.equal(gunther.messages[0], Message.format(Message.LVP_JETPACK_REMOVED_OTHER,
                                                        russell.name, russell.id));

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], Message.format(Message.LVP_JETPACK_REMOVED, gunther.name,
                                                         gunther.id));

        assert.equal(russell.specialAction, Player.kSpecialActionNone);
    });
});
