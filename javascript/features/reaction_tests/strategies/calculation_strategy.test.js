// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CalculationStrategy } from 'features/reaction_tests/strategies/calculation_strategy.js';

import { messages } from 'features/reaction_tests/reaction_tests.messages.js';

describe('CalculationStrategy', (it, beforeEach) => {
    let announceFn = null;
    let nuwani = null;
    let settings = null;

    beforeEach(() => {
        const driver = server.featureManager.loadFeature('reaction_tests');

        announceFn = driver.__proto__.announceToPlayers.bind(driver);
        nuwani = server.featureManager.loadFeature('nuwani');
        settings = server.featureManager.loadFeature('settings');
    });

    it('is able to calculate random strings of the exported specifications', assert => {
        for (let i = 0; i < 25; ++i) {
            const strategy = new CalculationStrategy(() => settings);

            strategy.start(announceFn, () => nuwani, 0);

            const answer = strategy.answer;
            const calculation = strategy.calculation;

            assert.typeOf(answer, 'string');
            assert.typeOf(calculation, 'string');

            assert.equal(parseInt(answer, 10), eval(calculation));

            strategy.stop();
        }
    });

    it('announces new tests to in-game players and Nuwani users', assert => {
        const gunther = server.playerManager.getById(/* Gunther= */ 0);
        const strategy = new CalculationStrategy(() => settings);

        assert.equal(gunther.messages.length, 0);
        assert.equal(nuwani.messagesForTesting.length, 0);

        strategy.start(announceFn, () => nuwani, 1234);

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0],
            messages.reaction_tests_announce_calculate(null, {
                calculation: strategy.calculation,
                prize: 1234,
            }));

        assert.equal(nuwani.messagesForTesting.length, 1);
        assert.deepEqual(nuwani.messagesForTesting[0], {
            tag: 'reaction-calculate',
            params: [ strategy.calculation, 1234 ]
        });

        strategy.stop();
    });
});
