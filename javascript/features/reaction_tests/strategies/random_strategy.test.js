// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { RandomStrategy } from 'features/reaction_tests/strategies/random_strategy.js';

describe('RandomStrategy', (it, beforeEach) => {
    let announceFn = null;
    let nuwani = null;

    beforeEach(() => {
        const driver = server.featureManager.loadFeature('reaction_tests');

        announceFn = driver.__proto__.announceToPlayers.bind(driver);
        nuwani = server.featureManager.loadFeature('nuwani');
    });

    it('is able to compute random strings of the exported specifications', assert => {
        for (let i = 0; i < 25; ++i) {
            const strategy = new RandomStrategy();

            strategy.start(announceFn, () => nuwani, 0);

            const answer = strategy.answer;

            assert.typeOf(answer, 'string');
            assert.isAboveOrEqual(answer.length, RandomStrategy.kMinimumLength);
            assert.isBelowOrEqual(answer.length, RandomStrategy.kMaximumLength);

            for (const character of answer)
                assert.includes(RandomStrategy.kAlphabet, character);
        }
    });

    it('announces new tests to in-game players and Nuwani users', assert => {
        const gunther = server.playerManager.getById(/* Gunther= */ 0);
        const strategy = new RandomStrategy();

        assert.equal(gunther.messages.length, 0);
        assert.equal(nuwani.messagesForTesting.length, 0);

        strategy.start(announceFn, () => nuwani, 1234);

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.REACTION_TEST_ANNOUNCE_REPEAT, strategy.answer, 1234));

        assert.equal(nuwani.messagesForTesting.length, 1);
        assert.deepEqual(nuwani.messagesForTesting[0], {
            tag: 'reaction-repeat',
            params: [ strategy.answer, 1234 ]
        });
    });
});
