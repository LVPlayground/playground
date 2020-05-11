// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import ReactionTests from 'features/reaction_tests/reaction_tests.js';

describe('ReactionTests', (it, beforeEach) => {
    /**
     * @type ReactionTests
     */
    let driver = null;

    /**
     * @type Player
     */
    let gunther = null;

    beforeEach(() => {
        driver = server.featureManager.loadFeature('reaction_tests');
        gunther = server.playerManager.getById(/* Gunther= */ 0);
    });

    it('should be able to calculate delays in range of delay & jitter settings', assert => {
        const settings = server.featureManager.loadFeature('settings');

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
});
