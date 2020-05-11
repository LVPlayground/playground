// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ReactionTests from 'features/reaction_tests/reaction_tests.js';
import { RememberStrategy } from 'features/reaction_tests/strategies/remember_strategy.js';
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

        // Have a a level of determinism in these tests to avoid flaky failures.
        driver.strategies_ = driver.strategies_.filter(strategyConstructor => {
            return strategyConstructor !== RememberStrategy;
        });
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
        assert.equal(gunther.account.reactionTests, 0);
        
        // (1) The first player to give the right answer will be awarded the money.
        await server.clock.advance(2560);

        gunther.issueMessage(driver.activeTest_.answer);

        assert.equal(gunther.messages.length, 3);
        assert.includes(gunther.messages[1], 'in 2.56 seconds');
        assert.equal(gunther.messages[2], Message.format(Message.REACTION_TEST_WON, prize));
        assert.equal(gunther.account.reactionTests, 1);

        // (2) Subsequent players will receive a generic "too late!" message.
        assert.equal(lucy.messages.length, 2);

        await server.clock.advance(1230);

        lucy.issueMessage(driver.activeTest_.answer);

        assert.equal(lucy.account.reactionTests, 0);
        assert.equal(lucy.messages.length, 3);
        assert.equal(
            lucy.messages[2], Message.format(Message.REACTION_TEST_TOO_LATE, gunther.name, 1.23));
    });

    it('should automatically schedule a new test after someone won', async (assert) => {
        const delay = settings.getValue('playground/reaction_test_delay_sec');
        const jitter = settings.getValue('playground/reaction_test_jitter_sec');

        assert.equal(gunther.messages.length, 0);

        // Wait until we're certain that the first reaction test has started.
        await server.clock.advance((delay + jitter) * 1000);

        assert.equal(gunther.messages.length, 1);

        gunther.issueMessage(driver.activeTest_.answer);
        assert.equal(gunther.messages.length, 3);

        // Wait until we're certain that the next reaction test has started.
        await server.clock.advance((delay + jitter) * 1000);

        assert.equal(gunther.messages.length, 4);
    });

    it('should automatically schedule a new test after one times out', async (assert) => {
        const delay = settings.getValue('playground/reaction_test_delay_sec');
        const jitter = settings.getValue('playground/reaction_test_jitter_sec');
        const timeout = settings.getValue('playground/reaction_test_expire_sec');

        assert.equal(gunther.messages.length, 0);

        // Wait until we're certain that the first reaction test has started.
        await server.clock.advance((delay + jitter) * 1000);

        assert.equal(gunther.messages.length, 1);

        const answer = driver.activeTest_.answer;

        // Wait for the timeout. Giving the right answer thereafter will be ignored.
        await server.clock.advance(timeout * 1000);

        gunther.issueMessage(answer);
        assert.equal(gunther.messages.length, 1);

        // Wait until we're certain that the next reaction test has started.
        await server.clock.advance((delay + jitter) * 1000);

        assert.equal(gunther.messages.length, 2);
    });
});
