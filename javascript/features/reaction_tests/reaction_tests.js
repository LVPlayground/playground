// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';

// Las Venturas Playground supports a variety of different reaction tests. They're shown in chat at
// certain intervals, and require players to repeat characters, do basic calculations or remember
// and repeat words or phrases. It's all powered by this feature.
export default class ReactionTests extends Feature {
    communication_ = null;
    nuwani_ = null;
    settings_ = null;

    nextTestToken_ = 0;
    strategies_ = null;

    constructor() {
        super();

        // This feature is a communication delegate, because we need to intercept messages.
        this.communication_ = this.defineDependency('communication');
        this.communication_.addReloadObserver(this, () =>
            this.communication_().addDelegate(this));

        this.communication_().addDelegate(this);

        // This feature depends on Nuwani to be able to echo messages.
        this.nuwani_ = this.defineDependency('nuwani');

        // This feature depends on Settings to allow Management members to change details about
        // how reaction tests work through the `/lvp settings` command.
        this.settings_ = this.defineDependency('settings');

        // Array of the available strategies for reaction tests. Each of those corresponds to a
        // particular type of tests, for example repeat-the-word, or calculations.
        this.strategies_ = [
            // TODO
        ];

        // Immediately schedule the first reaction test to start.
        this.scheduleNextTest();
    }

    // ---------------------------------------------------------------------------------------------

    // Calculates the delay until the next test has to take place. This is the delay configured in
    // the settings, with a certain amount of jitter applied.
    calculateDelayForNextTest() {
        const delay = this.settings_().getValue('playground/reaction_test_delay_sec');
        const jitter = this.settings_().getValue('playground/reaction_test_jitter_sec');

        return delay + Math.floor(Math.random() * 2 * jitter) - jitter;
    }

    // Schedules the next test to be started after a calculated delay. Each scheduled test has a
    // token, to allow tests to be re-started for any reason whilst another one is pending.
    scheduleNextTest() {
        const delay = this.calculateDelayForNextTest();
        wait(delay * 1000).then(() =>
            this.startReactionTest(++nextTestToken_));
    }

    // Returns whether the test should be skipped. This could be the case because there are no
    // players in-game, in which case we don't want to spam people watching via Nuwani.
    shouldSkipReactionTest() {
        for (const player of server.playerManager) {
            if (!player.isNonPlayerCharacter())
                return false;
        }

        return true;
    }

    // Starts the next reaction test. First the token is verified to make sure it's still the latest
    // scheduled test, then we check requirements, then we launch a test.
    startReactionTest(nextTestToken) {
        if (this.nextTestToken_ !== nextTestToken)
            return;  // the token has expired, another test was scheduled
        
        // Fast-path: skip this test if the conditions for running a test are not met.
        if (this.shouldSkipReactionTest()) {
            this.scheduleNextTest();
            return;
        }

        // TODO

        this.scheduleNextTest();
    }

    // Called when the |player| has sent the given |message|. If a test is active, and they've got
    // the right answer, then it's something we should be handling.
    onPlayerText(player, message) {
        return false;
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.communication_.removeReloadObserver(this);

        this.nextTestToken_ = null;
    }
}
