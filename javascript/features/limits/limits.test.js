// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { format } from 'base/format.js';

describe('Limits', (it, beforeEach) => {
    let decider = null;
    let feature = null;
    let gunther = null;
    let russell = null;
    let settings = null;

    beforeEach(() => {
        feature = server.featureManager.loadFeature('limits');
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        settings = server.featureManager.loadFeature('settings');

        decider = feature.decider_;
    });

    it('rejects invalid requirements and throttles', assert => {
        assert.throws(() => decider.decide(gunther, { requirements: [ 'bananas' ] }));
    });

    it('should allow operations when no requirements or throttles have been passed', assert => {
        assert.isTrue(decider.decide(gunther, {}).isApproved());
    });

    it('should properly support the deathmatch requirement', async (assert) => {
        const kDamageIssuedCooldown = settings.getValue('limits/deathmatch_damage_issued_cooldown');
        const kDamageTakenCooldown = settings.getValue('limits/deathmatch_damage_taken_cooldown');
        const kWeaponFiredCooldown = settings.getValue('limits/deathmatch_weapon_fired_cooldown');

        // (1) The requirement should pass by default.
        assert.isNull(decider.processDeathmatchRequirement(
            gunther, server.clock.monotonicallyIncreasingTime()));

        // (2) The requirement should fail if a weapon has recently been fired.
        gunther.shoot();
        {
            const decision = decider.processDeathmatchRequirement(
                gunther, server.clock.monotonicallyIncreasingTime());

            assert.isNotNull(decision);
            assert.equal(decision.toString(), Message.LIMITS_DEATHMATCH_WEAPON_FIRED);

            await server.clock.advance(kDamageIssuedCooldown * 1000);
        }

        assert.isNull(decider.processDeathmatchRequirement(
            gunther, server.clock.monotonicallyIncreasingTime()));

        // (3) The requirement should fail if damage has recently been issued.
        gunther.shoot({ target: russell });
        {
            const decision = decider.processDeathmatchRequirement(
                gunther, server.clock.monotonicallyIncreasingTime());

            assert.isNotNull(decision);
            assert.equal(decision.toString(), Message.LIMITS_DEATHMATCH_DAMAGE_ISSUED);

            await server.clock.advance(kDamageTakenCooldown * 1000);
        }

        assert.isNull(decider.processDeathmatchRequirement(
            gunther, server.clock.monotonicallyIncreasingTime()));

        // (4) The requirement should fail if damage has recently been taken.
        russell.shoot({ target: gunther });
        {
            const decision = decider.processDeathmatchRequirement(
                gunther, server.clock.monotonicallyIncreasingTime());

            assert.isNotNull(decision);
            assert.equal(decision.toString(), Message.LIMITS_DEATHMATCH_DAMAGE_TAKEN);

            await server.clock.advance(kWeaponFiredCooldown * 1000);
        }

        assert.isNull(decider.processDeathmatchRequirement(
            gunther, server.clock.monotonicallyIncreasingTime()));

        // (5) The requirements are reset when the player respawns.
        gunther.shoot();
        gunther.respawn();

        assert.isNull(decider.processDeathmatchRequirement(
            gunther, server.clock.monotonicallyIncreasingTime()));

        gunther.shoot({ target: russell });
        gunther.respawn();

        assert.isNull(decider.processDeathmatchRequirement(
            gunther, server.clock.monotonicallyIncreasingTime()));

        russell.shoot({ target: gunther });
        gunther.respawn();

        assert.isNull(decider.processDeathmatchRequirement(
            gunther, server.clock.monotonicallyIncreasingTime()));
    });

    it('should properly support the main world and outside requirements', assert => {
        assert.isNull(decider.processMainWorldRequirement(gunther));
        assert.isNull(decider.processOutsideRequirement(gunther));

        // (1) Rejection will be issued when the player is not in the main world.
        gunther.virtualWorld = 1337;
        {
            const decision = decider.processMainWorldRequirement(gunther);

            assert.isNotNull(decision);
            assert.equal(decision.toString(), Message.LIMITS_NOT_IN_MAIN_WORLD);

            gunther.virtualWorld = 0;
        }

        assert.isNull(decider.processMainWorldRequirement(gunther));

        // (2) Rejection will be issued when the player is not outside.
        gunther.interiorId = 6;
        {
            const decision = decider.processOutsideRequirement(gunther);

            assert.isNotNull(decision);
            assert.equal(decision.toString(), Message.LIMITS_NOT_OUTSIDE);

            gunther.interiorId = 0;
        }

        assert.isNull(decider.processOutsideRequirement(gunther));
    });

    it('should properly support the minigame requirements', assert => {
        assert.isNull(decider.processMinigameRequirement(gunther));

        // (1) JavaScript `Games`-feature driven games
        gunther.syncedData.minigameName = 'Haystack Extreme';
        {
            const decision = decider.processMinigameRequirement(gunther);

            assert.isNotNull(decision);
            assert.equal(
                decision.toString(), format(Message.LIMITS_OCCUPIED_MINIGAME, 'Haystack Extreme'));
            
            gunther.syncedData.minigameName = null;
        }

        assert.isNull(decider.processMinigameRequirement(gunther));

        // (2) Deprecated Activity-based games
        gunther.activity = Player.PLAYER_ACTIVITY_JS_RACE;
        {
            const decision = decider.processMinigameRequirement(gunther);

            assert.isNotNull(decision);
            assert.equal(
                decision.toString(), format(Message.LIMITS_OCCUPIED_MINIGAME, 'a race'));
            
            gunther.activity = Player.PLAYER_ACTIVITY_NONE;
        }

        assert.isNull(decider.processMinigameRequirement(gunther));
    });

    it('should be able to run through each of the public API methods', assert => {
        assert.isTrue(feature.canSpawnVehicle(gunther).isApproved());
        assert.isTrue(feature.canTeleport(gunther).isApproved());
    });
});
