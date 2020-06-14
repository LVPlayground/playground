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

        // (3) Animations that prepare the player by turning them around.
        assert.equal(gunther.rotation, 0);
        assert.isTrue(await gunther.issueCommand('/wave'));
        assert.equal(gunther.getLastAnimationForTesting(), 'KISSING:BD_GF_Wave');
        assert.equal(gunther.rotation, 180);
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

    it('should be able to make players dance', async (assert) => {
        await russell.identify();

        // (1) Players should be able to make themselves dance.
        assert.equal(gunther.specialAction, Player.kSpecialActionNone);
        assert.isTrue(await gunther.issueCommand('/dance 3'));
        assert.equal(gunther.specialAction, Player.kSpecialActionDance3);

        gunther.specialAction = Player.kSpecialActionNone;

        // (2) Administrators should be able to make other players dance.
        assert.equal(gunther.specialAction, Player.kSpecialActionNone);
        assert.isTrue(await russell.issueCommand('/dance 2 Gunther'));
        assert.equal(gunther.specialAction, Player.kSpecialActionDance2);
    });

    it('should be able to show players a dialog with all available animations', async (assert) => {
        gunther.respondToDialog({ response: 0 /* Dismiss */ });

        assert.isTrue(await gunther.issueCommand('/animations'));
        assert.includes(gunther.lastDialog, '/dance [1-4]');
        assert.includes(gunther.lastDialog, '/piss');
        assert.includes(gunther.lastDialog, '/sit');
        assert.includes(gunther.lastDialog, '/wave');
    });
});
