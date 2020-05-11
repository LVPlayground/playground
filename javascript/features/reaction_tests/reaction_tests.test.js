// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ReactionTests from 'features/reaction_tests/reaction_tests.js';
import Settings from 'features/settings/settings.js';

describe('ReactionTests', (it, beforeEach) => {
    /**
     * @type ReactionTests
     */
    let driver = null;

    /**
     * @type Player
     */
    let gunther = null;

    /**
     * @type Player
     */
    let lucy = null;

    /**
     * @type Settings
     */
    let settings = null;

    beforeEach(() => {
        driver = server.featureManager.loadFeature('reaction_tests');
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        lucy = server.playerManager.getById(/* Lucy= */ 2);
        settings = server.featureManager.loadFeature('settings');
    });

    it('should be able to calculate delays in range of delay & jitter settings', assert => {
        const delay = settings.getValue('playground/reaction_test_delay_sec');
        const jitter = settings.getValue('playground/reaction_test_jitter_sec');

        const minimum = delay - jitter;
        const maximum = delay + jitter;

        for (let i = 0; i < 100; ++i) {
            assert.isAboveOrEqual(driver.calculateDelayForNextTest(), minimum);
            assert.isBelowOrEqual(driver.calculateDelayForNextTest(), maximum);
        }
    });

    it('should be able to determine when to skip tests', assert => {
        assert.isFalse(driver.shouldSkipReactionTest());

        for (let player of server.playerManager)
            player.setIsNonPlayerCharacterForTesting(true);

        assert.isTrue(driver.shouldSkipReactionTest());

        dispatchEvent('playerconnect', {
            playerid: 42,
        });

        assert.isFalse(driver.shouldSkipReactionTest());
    });

    it('should enable players to win reaction tests', async (assert) => {
        const delay = settings.getValue('playground/reaction_test_delay_sec');
        const jitter = settings.getValue('playground/reaction_test_jitter_sec');
        const prize = settings.getValue('playground/reaction_test_prize');

        assert.equal(gunther.messages.length, 0);

        // Wait until we're certain that the first reaction test has started.
        await server.clock.advance((delay + jitter) * 1000);

        assert.equal(gunther.messages.length, 1);
        
        // (1) The first player to give the right answer will be awarded the money.
        await server.clock.advance(2567);

        gunther.issueMessage(driver.activeTest_.answer);

        assert.equal(gunther.messages.length, 3);
        assert.includes(gunther.messages[1], 'in 2.57 seconds');
        assert.equal(gunther.messages[2], Message.format(Message.REACTION_TEST_WON, prize));

    });

    it.fails();
});
