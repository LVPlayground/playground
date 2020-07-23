// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { kFixedDamageAmounts,
         kMultiBulletDamageAmounts,
         kPistolWhipWeaponIds } from 'features/abuse/detectors/cleo_dmage_detector.js';

describe('CleoDmageDetector', (it, beforeEach) => {
    let gunther = null;
    let russell = null;

    let settings = null;

    beforeEach(() => {
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        settings = server.featureManager.loadFeature('settings');

        // Make Russell an administrator so that they receives admin notices.
        russell.level = Player.LEVEL_ADMINISTRATOR;

        // Load the |abuse| feature to make sure the detectors are running.
        server.featureManager.loadFeature('abuse');
    });

    it('is able to detect violations of weapons that inflict fixed damage', assert => {
        settings.setValue('abuse/detector_cleo_dmage', /* enabled= */ true);

        for (const [weaponId, fixedDamageAmount] of kFixedDamageAmounts) {
            const existingMessageCount = russell.messages.length;

            // If it's possible to whip another player with the butt of the gun, an exception will
            // make sure that it's neither recorded, nor incorrectly included in measurements.
            if (kPistolWhipWeaponIds.has(weaponId)) {
                dispatchEvent('playertakedamage', {
                    playerid: gunther.id,
                    issuerid: russell.id,
                    amount: 2.640000105,
                    weaponid: weaponId,
                    bodypart: 3,  // Torso
                });

                assert.equal(russell.messages.length, existingMessageCount);
            }

            // Other values that are not equal to the fixed amount will have to be reported as per
            // usual. We're confident in these cases, so an administrator notice will go out.
            dispatchEvent('playertakedamage', {
                playerid: gunther.id,
                issuerid: russell.id,
                amount: fixedDamageAmount + 1,  // anything beyond the sigma
                weaponid: weaponId,
                bodypart: 3,  // Torso
            });

            assert.equal(russell.messages.length, existingMessageCount + 1);
            assert.includes(russell.messages[existingMessageCount], 'has been suspected');
            assert.includes(russell.messages[existingMessageCount], 'CLEO Dmage');
        }
    });

    it('is understands weapons that fire multiple bullets, and their damage patterns', assert => {
        settings.setValue('abuse/detector_cleo_dmage', /* enabled= */ true);

        for (const [weaponId, damageInfo] of kMultiBulletDamageAmounts) {
            // Verify that shots with up to |damage| bullets hitting pass the tests.
            for (let bulletCount = 0; bulletCount < damageInfo.bullets; ++bulletCount) {
                const existingMessageCount = russell.messages.length;

                dispatchEvent('playertakedamage', {
                    playerid: gunther.id,
                    issuerid: russell.id,
                    amount: bulletCount * damageInfo.damage,
                    weaponid: weaponId,
                    bodypart: 3,  // Torso
                });

                assert.equal(russell.messages.length, existingMessageCount);
            }

            // Verify that any value that's not a multiple of the bullet count, or exceeds the
            // number of bullets fired by this weapon, does yield a warning.
            for (const bulletMultiplier of [0.5, 1.5, damageInfo.bullets + 1]) {
                const existingMessageCount = russell.messages.length;

                dispatchEvent('playertakedamage', {
                    playerid: gunther.id,
                    issuerid: russell.id,
                    amount: damageInfo.damage * bulletMultiplier,
                    weaponid: weaponId,
                    bodypart: 3,  // Torso
                });

                assert.equal(russell.messages.length, existingMessageCount + 1);
                assert.includes(russell.messages[existingMessageCount], 'has been suspected');
                assert.includes(russell.messages[existingMessageCount], 'CLEO Dmage');
            }
        }
    });

    it('is able to detect use of Cleo Dmage detector over time', assert => {
        settings.setValue('abuse/detector_cleo_dmage', /* enabled= */ true);

        for (let i = 0; i < 50; ++i) {
            dispatchEvent('playertakedamage', {
                playerid: gunther.id,
                issuerid: russell.id,
                amount: Math.random() * 10,
                weaponid: 26,  // Sawn-off shotgun
                bodypart: 3,  // Torso
            });
        }
    });
});
