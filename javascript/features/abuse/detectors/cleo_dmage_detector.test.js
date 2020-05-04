// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { kFixedDamageAmounts } from 'features/abuse/detectors/cleo_dmage_detector.js';

describe('CleoDmageDetector', (it, beforeEach) => {
    let gunther = null;
    let russell = null;

    let settings = null;

    beforeEach(() => {
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        settings = server.featureManager.loadFeature('settings');

        // Make Russell an administrator so that he receives admin notices.
        russell.level = Player.LEVEL_ADMINISTRATOR;

        // Load the |abuse| feature to make sure the detectors are running.
        server.featureManager.loadFeature('abuse');
    });

    it('is able to detect violations of weapons that inflict fixed damage', assert => {
        settings.setValue('abuse/detector_cleo_dmage', /* enabled= */ true);

        for (const [weaponId, fixedDamageAmount] of kFixedDamageAmounts) {
            const existingMessageCount = russell.messages.length;

            dispatchEvent('playertakedamage', {
                playerid: gunther.id,
                issuerid: russell.id,
                amount: fixedDamageAmount + 1,  // anything beyond the sigma
                weaponid: weaponId,
                bodypart: 3,  // Torso
            });

            assert.equal(russell.messages.length, existingMessageCount + 1);
            assert.includes(
                russell.messages[existingMessageCount],
                Message.format(Message.ABUSE_ADMIN_DETECTED, gunther.name, gunther.id,
                               'CLEO Dmage'));
        }
    });

    it('is able to detect use of Cleo Dmage detector over time', assert => {
        settings.setValue('abuse/detector_cleo_dmage', /* enabled= */ true);

        for (let i = 0; i < 50; ++i) {
            dispatchEvent('playertakedamage', {
                playerid: gunther.id,
                issuerid: russell.id,
                amount: Math.random() * 10,
                weaponid: 31,  // WEAPON_M4
                bodypart: 3,  // Torso
            });
        }
    });
});
