// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CalculationStrategy } from 'features/reaction_tests/strategies/calculation_strategy.js';
import Feature from 'components/feature_manager/feature.js';
import { RandomStrategy } from 'features/reaction_tests/strategies/random_strategy.js';
import { RememberStrategy } from 'features/reaction_tests/strategies/remember_strategy.js';

import { format } from 'base/string_formatter.js';

// Las Venturas Playground supports a variety of different reaction tests. They're shown in chat at
// certain intervals, and require players to repeat characters, do basic calculations or remember
// and repeat words or phrases. It's all powered by this feature.
export default class ReactionTests extends Feature {
    communication_ = null;
    nuwani_ = null;
    settings_ = null;

    strategies_ = null;

    activeTest_ = null;
    activeTestStart_ = null;
    activeTestToken_ = 0;
    activeTestWinnerName_ = null;
    activeTestWinnerTime_ = null;

    constructor() {
        super();

        // This feature is a communication delegate, because we need to intercept messages.
        this.communication_ = this.defineDependency('communication');
        this.communication_.addReloadObserver(this, () =>
            this.communication_().addDelegate(this));

        this.communication_().addDelegate(this);

        // Need to be able to actually award money to players.
        this.finance_ = this.defineDependency('finance');

        // This feature depends on Nuwani to be able to echo messages.
        this.nuwani_ = this.defineDependency('nuwani');

        // This feature depends on Settings to allow Management members to change details about
        // how reaction tests work through the `/lvp settings` command.
        this.settings_ = this.defineDependency('settings');

        // Array of the available strategies for reaction tests. Each of those corresponds to a
        // particular type of tests, for example repeat-the-word, or calculations.
        this.strategies_ = [
            CalculationStrategy,
            RandomStrategy,
            RememberStrategy,
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
        const token = ++this.activeTestToken_;

        wait(delay * 1000).then(() =>
            this.startReactionTest(token));
    }

    // Picks a reaction test strategy. In essense this picks a random reaction tests which meets the
    // requirements to be ran at the current time, which is player-based.
    createReactionTestStrategy() {
        let candidateStrategies = [];
        let onlinePlayerCount = 0;

        for (const player of server.playerManager) {
            if (!player.isNonPlayerCharacter())
                ++onlinePlayerCount;
        }

        // Determine the candidate strategies based on them matching the requirements.
        for (const strategyConstructor of this.strategies_) {
            if (strategyConstructor.kMinimumPlayerCount <= onlinePlayerCount)
                candidateStrategies.push(strategyConstructor);
        }

        if (!candidateStrategies.length)
            return null;  // none of the strategies wishes to be ran at this time
        
        const index = Math.floor(Math.random() * candidateStrategies.length);
        return new candidateStrategies[index](this.settings_);
    }

    // Announces the given |message| with the |params| to all players eligible to participate.
    announceToPlayers(message, ...params) {
        const assembledMessage = format(message, ...params);

        for (const player of server.playerManager)
            player.sendMessage(assembledMessage);
    }

    // Starts the next reaction test. First the token is verified to make sure it's still the latest
    // scheduled test, then we check requirements, then we launch a test.
    startReactionTest(activeTestToken) {
        if (this.activeTestToken_ !== activeTestToken)
            return;  // the token has expired, another test was scheduled

        const strategy = this.createReactionTestStrategy();
        if (!strategy)
            return;

        // Actually start the test. This will make all the necessary announcements too.
        strategy.start(
            ReactionTests.prototype.announceToPlayers.bind(this), this.nuwani_,
            this.settings_().getValue('playground/reaction_test_prize'));

        this.activeTest_ = strategy;
        this.activeTestStart_ = server.clock.monotonicallyIncreasingTime();
        this.activeTestWinnerName_ = null;
        this.activeTestWinnerTime_ = null;

        const timeout = this.settings_().getValue('playground/reaction_test_expire_sec');
        wait(timeout * 1000).then(() =>
            this.reactionTestTimedOut(this.activeTestToken_));
    }

    // Called when the |player| has sent the given |message|. If a test is active, and they've got
    // the right answer, then it's something we should be handling.
    onPlayerText(player, message) {
        if (!this.activeTest_ || !this.activeTest_.verify(message))
            return false;
        
        const currentTime = server.clock.monotonicallyIncreasingTime();
        const prize = this.settings_().getValue('playground/reaction_test_prize');

        if (this.activeTestWinnerName_ && this.activeTestWinnerName_ === player.name) {
            // Do nothing, the player's just repeating themselves. Cocky!
        } else if (this.activeTestWinnerName_) {
            const difference = Math.round((currentTime - this.activeTestWinnerTime_) / 10) / 100;
            player.sendMessage(
                Message.REACTION_TEST_TOO_LATE, this.activeTestWinnerName_, difference);

        } else {
            const previousWins = player.account.reactionTests;
            const differenceOffset = this.activeTest_.answerOffsetTimeMs;
            const difference =
                Math.round((currentTime - (this.activeTestStart_ + differenceOffset)) / 10) / 100;

            this.nuwani_().echo('reaction-result', player.name, player.id, difference);
            if (previousWins <= 1) {
                const message = previousWins === 0 ? Message.REACTION_TEST_ANNOUNCE_WINNER_FIRST
                                                   : Message.REACTION_TEST_ANNOUNCE_WINNER_SECOND;

                this.announceToPlayers(message, player.name, difference);
            } else {
                this.announceToPlayers(
                    Message.REACTION_TEST_ANNOUNCE_WINNER, player.name, difference, previousWins);
            }

            // Increment the number of wins in the player's statistics.
            player.account.reactionTests++;

            // Give them their prize money.
            this.finance_().givePlayerCash(player, prize);

            // Finally, let the |player| know about the prize they've won.
            player.sendMessage(Message.REACTION_TEST_WON, prize);

            this.activeTestWinnerName_ = player.name;
            this.activeTestWinnerTime_ = currentTime;

            // Schedule the next test now that someone has given an answer.
            this.scheduleNextTest();
        }

        return true;
    }

    // Called when a reaction test may have timed out. We verify this by checking the token. If it
    // has timed out, then we'll request scheduling of a new test.
    reactionTestTimedOut(activeTestToken) {
        if (this.activeTestToken_ !== activeTestToken)
            return;  // the token has expired, another test was scheduled
        
        if (this.activeTestWinnerTime_ !== null)
            return;  // someone answered the previous reaction test, another was scheduled

        this.activeTest_.stop();
        this.activeTest_ = null;

        this.scheduleNextTest();
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.communication_.removeReloadObserver(this);

        if (this.activeTest_) {
            this.activeTest_.stop();
            this.activeTest_ = null;
        }

        this.activeTestToken_ = null;
    }
}
