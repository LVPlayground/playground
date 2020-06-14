// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('Animations', (it, beforeEach) => {
    let gunther = null;
    let russell = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('animations');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        russell.level = Player.LEVEL_ADMINISTRATOR;

        // Load all animations from the configuration file.
        feature.loadAnimations();
    });

    it('should be able to load and process player animations', async (assert) => {
        // (1) Animations based on `ApplyAnimation` Pawn calls.
        assert.isNull(gunther.getLastAnimationForTesting());
        assert.isTrue(await gunther.issueCommand('/sit'));
        assert.equal(gunther.getLastAnimationForTesting(), 'MISC:SEAT_LR');

        // (2) Animations based on special actions.
        assert.equal(gunther.specialAction, Player.kSpecialActionNone);
        assert.isTrue(await gunther.issueCommand('/piss'));
        assert.equal(gunther.specialAction, Player.kSpecialActionPissing);
    });

    it('should be able to force animations on other players, with a message', async (assert) => {
        await russell.identify();

        assert.equal(gunther.specialAction, Player.kSpecialActionNone);

        assert.isTrue(await russell.issueCommand('/piss Gunther'));

        assert.equal(russell.messages.length, 2);
        assert.equal(russell.specialAction, Player.kSpecialActionNone);
        assert.equal(
            russell.messages[0],
            Message.format(Message.ANIMATIONS_EXECUTED, 'piss', gunther.name, gunther.id));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.specialAction, Player.kSpecialActionPissing);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.ANIMATIONS_EXECUTE_BY_ADMIN, russell.name, russell.id, 'piss'));
    });
});
