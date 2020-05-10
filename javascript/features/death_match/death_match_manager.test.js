// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathMatchManger } from "features/death_match/death_match_manager.js";

describe('DeathMatchManager', (it, beforeEach) => {
    let manager = null;

    beforeEach(async => {
        
        const abuse = server.featureManager.getFeatureForTests('abuse');
        manager = new DeathMatchManger(abuse);
    });

    it('should show message for player if using invalid dm zone', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        manager.goToDmZone(gunther, 0);

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