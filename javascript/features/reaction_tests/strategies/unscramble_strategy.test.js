// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { UnscrambleStrategy } from 'features/reaction_tests/strategies/unscramble_strategy.js';

import { range } from 'base/range.js';
import { symmetricDifference } from 'base/set_extensions.js';

describe('UnscrambleStrategy', (it, beforeEach) => {
    let announceFn = null;
    let nuwani = null;
    let settings = null;

    beforeEach(() => {
        const driver = server.featureManager.loadFeature('reaction_tests');

        announceFn = driver.__proto__.announceToPlayers.bind(driver);
        nuwani = server.featureManager.loadFeature('nuwani');
        settings = server.featureManager.loadFeature('settings');
    });

    it('is able to scramble words while maintaining the correct answer', assert => {
        const strategy = new UnscrambleStrategy(() => settings);

        // (1) Test the shuffling function.
        const values = range(100);
        const shuffled = strategy.shuffle(values);

        assert.equal(values.length, shuffled.length);
        assert.equal(symmetricDifference(new Set(values), new Set(shuffled)).size, 0);

        // (2) Test the scrambling function.
        const input = 'This abcdef is xyz123 a test';
        const scrambled = strategy.scramble(input);

        assert.equal(input.length, scrambled.length);
        assert.equal(symmetricDifference(new Set(values), new Set(shuffled)).size, 0);
    });

    it('is able to change difficulty level through static letters', assert => {
        const strategy = new UnscrambleStrategy(() => settings);

        // (1) Don't scramble the words at all.
        settings.setValue('playground/reaction_test_unscramble_fixed', 100);

        strategy.start(announceFn, () => nuwani, 1234);
        assert.equal(strategy.answer, strategy.scrambled);

        // (2) Heavily scramble the words, with on fixed letters.
        settings.setValue('playground/reaction_test_unscramble_fixed', 0);

        strategy.start(announceFn, () => nuwani, 1234);
        assert.notEqual(strategy.answer, strategy.scrambled);
    });

    it('announces new tests to in-game players and Nuwani users', assert => {
        const gunther = server.playerManager.getById(/* Gunther= */ 0);
        const strategy = new UnscrambleStrategy(() => settings);

        assert.equal(gunther.messages.length, 0);
        assert.equal(nuwani.messagesForTesting.length, 0);

        strategy.start(announceFn, () => nuwani, 1234);

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.REACTION_TEST_ANNOUNCE_UNSCRAMBLE, strategy.scrambled, 1234));

        assert.equal(nuwani.messagesForTesting.length, 1);
        assert.deepEqual(nuwani.messagesForTesting[0], {
            tag: 'reaction-unscramble',
            params: [ strategy.scrambled, 1234 ]
        });

        strategy.stop();
    });
});
