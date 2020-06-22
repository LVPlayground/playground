// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import AbuseConstants from 'features/abuse/abuse_constants.js';
import DeathMatch from "features/death_match/death_match.js";

describe('DeathMatchManager', (it, beforeEach) => {
    let commands = null;
    let manager = null;
    let deathMatch = null;

    beforeEach(async => {
        server.featureManager.registerFeaturesForTests({
            death_match: DeathMatch
        });

        deathMatch = server.featureManager.loadFeature('death_match');

        commands = deathMatch.commands_
        manager = deathMatch.manager_;
    });

    it('should not enable players to go to a DM zone when they might abuse it', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        gunther.identify({ userId: 42 });
        gunther.shoot({ target: russell });

        assert.isTrue(await gunther.issueCommand('/deathmatch 1'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.DEATH_MATCH_TELEPORT_BLOCKED,
                AbuseConstants.REASON_FIRED_WEAPON));
    });

    it('should not allow players to go to a death match if they are in another activity', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.activity = Player.PLAYER_ACTIVITY_JS_RACE;
       
        assert.isTrue(await gunther.issueCommand('/deathmatch 1'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.DEATH_MATCH_TELEPORT_BLOCKED, "you are in another activity."));
    });

    it('should allow to use death match leave', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.isTrue(await gunther.issueCommand('/deathmatch leave'));
    });

    it('should show menu and teleport to zone if done without zone', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);        

        gunther.respondToDialog({ listitem: 0 /* Assumed `zone 1` */ });

        assert.isTrue(await gunther.issueCommand('/deathmatch'));

        assert.equal(gunther.messages.length, 3);
        assert.includes(gunther.messages[0], 
            Message.format(Message.DEATH_MATCH_INSTRUCTION_LEAVE, 0));
    });

    it('should show message for player if using invalid dm zone', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);        

        gunther.respondToDialog({ listitem: 0 /* Assumed `zone 1` */ });

        assert.isTrue(await gunther.issueCommand('/deathmatch 0'));

        assert.equal(gunther.messages.length, 3);
        assert.includes(gunther.messages[0], 
            Message.format(Message.DEATH_MATCH_INSTRUCTION_LEAVE, 0));
    });

    it('should allow to use gang zone 1', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.isTrue(await gunther.issueCommand('/deathmatch 1'));

        assert.equal(gunther.messages.length, 3);
        assert.includes(gunther.messages[0], 
            Message.format(Message.DEATH_MATCH_INSTRUCTION_LEAVE, 0));
    });
});