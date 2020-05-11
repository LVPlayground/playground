// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { RememberStrategy } from 'features/reaction_tests/strategies/remember_strategy.js';

describe('RememberStrategy', (it, beforeEach) => {
    let announceFn = null;
    let nuwani = null;
    let settings = null;

    beforeEach(() => {
        const driver = server.featureManager.loadFeature('reaction_tests');
        driver.activeTestToken_ = null;  // disable other tests

        announceFn = driver.__proto__.announceToPlayers.bind(driver);
        nuwani = server.featureManager.loadFeature('nuwani');
        settings = server.featureManager.loadFeature('settings');
    });

    it('is able to make people remember numbers per the given specifications', assert => {
        for (let i = 0; i < 25; ++i) {
            const strategy = new RememberStrategy(() => settings);

            strategy.start(announceFn, () => nuwani, 0);

            const answer = strategy.answer;

            assert.typeOf(answer, 'number');
            assert.isAboveOrEqual(answer, RememberStrategy.kMinimumNumber);
            assert.isBelowOrEqual(answer, RememberStrategy.kMaximumNumber);

            strategy.stop();
        }
    });

    it('announces new tests to in-game players and Nuwani users', async (assert) => {
        const gunther = server.playerManager.getById(/* Gunther= */ 0);
        const strategy = new RememberStrategy(() => settings);

        assert.equal(gunther.messages.length, 0);
        assert.equal(nuwani.messagesForTesting.length, 0);

        strategy.start(announceFn, () => nuwani, 1234);

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.REACTION_TEST_ANNOUNCE_REMEMBER, strategy.answer));

        assert.equal(nuwani.messagesForTesting.length, 1);
        assert.deepEqual(nuwani.messagesForTesting[0], {
            tag: 'reaction-remember',
            params: [ 1234 ]
        });

        // However, the right answer should not be accepted just yet.
        assert.isFalse(strategy.verify(strategy.answer));

        // Wait for the maximum amount of time the remember test could be waiting for.
        const delay = settings.getValue('playground/reaction_test_remember_delay_sec');
        const jitter = settings.getValue('playground/reaction_test_remember_jitter_sec');

        await server.clock.advance((delay + jitter) * 1000);

        // Expect new messages to all players, as well as people watching Nuwani.
        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1],
            Message.format(Message.REACTION_TEST_ANNOUNCE_REMEMBER_2, 1234));

        assert.equal(nuwani.messagesForTesting.length, 2);
        assert.deepEqual(nuwani.messagesForTesting[1], {
            tag: 'reaction-remember-2',
            params: [ 1234 ]
        });

        // The answer should now be accepted.
        assert.isTrue(strategy.verify(strategy.answer.toString()));

        strategy.stop();
    });

    it('should ignore thousand separators when validating the answer', assert => {
        const strategy = new RememberStrategy(() => settings);

        strategy.state_ = RememberStrategy.kStateActive;
        strategy.answer_ = 123456;

        assert.isTrue(strategy.verify('123,456'));

        strategy.stop();
    });

    it('should work sensibly with default server settings', assert => {
        const delay = settings.getValue('playground/reaction_test_remember_delay_sec');
        const jitter = settings.getValue('playground/reaction_test_remember_jitter_sec');

        const expire = settings.getValue('playground/reaction_test_expire_sec');

        // If this test fails, then the expire time is shorter than the maximum wait time for the
        // remember tests. This means that player's wont have the chance to answer.
        assert.isBelow(delay + jitter, expire);
    });
});
