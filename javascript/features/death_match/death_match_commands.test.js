// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

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

    it('should allow to use gang zone 1', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.isTrue(await gunther.issueCommand('/deathmatch 1'));

        assert.equal(gunther.messages.length, 1);
    });

    it('should show message for player if using invalid dm zone', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.isTrue(await gunther.issueCommand('/deathmatch 0'));

        assert.equal(gunther.messages.length, 2);
        assert.isTrue(
            gunther.messages[0].includes(
                Message.format(Message.DEATH_MATCH_INVALID_ZONE, 0)));
        assert.isTrue(
            gunther.messages[1].includes(
                Message.format(Message.DEATH_MATCH_AVAILABLE_ZONES, 
                    manager.validDmZones().join(', '))));
    });
});