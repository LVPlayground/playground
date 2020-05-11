// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Strategy } from 'features/reaction_tests/strategy.js';

// This strategy works by creating a reasonably simple calculation for the player to solve. It could
// be simple addition/substraction, but it's also possible for them to include a multiplication.
export class CalculationStrategy extends Strategy {
    answer_ = null;
    calculation_ = null;
    settings_ = null;

    constructor(settings) {
        super();

        this.settings_ = settings;
    }

    // Gets the answer to the current reaction test. May be NULL.
    get answer() { return this.answer_; }

    // Gets the calculation that the players were asked to resolve. May be NULL.
    get calculation() { return this.calculation_; }

    // Starts a new test provided by this strategy. The question must be determined, and it should
    // be announced to people in-game and available through Nuwani accordingly.
    start(announceFn, nuwani, prize) {
        const multiplicationPercentage =
            this.settings_().getValue('playground/reaction_test_multiplication_pct');

        if (this.randomInteger(0, 100) <= multiplicationPercentage)
            this.composeMultiplication();
        else
            this.composeSimpleCalculation();

        // Announce the test to all in-game participants.
        announceFn(Message.REACTION_TEST_ANNOUNCE_CALCULATE, this.calculation_, prize);

        // Announce the test to everyone reading along through Nuwani.
        nuwani.echo('reaction-calculate', this.calculation_, prize);
    }

    // Verifies whether the |message| is, or contains, the answer to this reaction test.
    verify(message) {
        return message === this.answer_;
    }

    // Composes a calculation test that's based around a multiplication.
    composeMultiplication() {
        const compositionLeft = this.randomInteger(1, 99);
        const compositionRight = this.randomInteger(1, 99);
        const multiplier = this.randomInteger(2, 5);

        if (this.coinFlip()) {
            this.calculation_ = `(${compositionLeft} - ${compositionRight}) * ${multiplier}`;
            this.answer_ = ((compositionLeft - compositionRight) * multiplier).toString();
        } else {
            this.calculation_ = `(${compositionLeft} + ${compositionRight}) * ${multiplier}`;
            this.answer_ = ((compositionLeft + compositionRight) * multiplier).toString();
        }
    }

    // Composes a calculation test that's a simple calculation involving addition and substraction.
    // These should be the majority of calculations on Las Venturas Playground.
    composeSimpleCalculation() {
        const compositionLeft = this.randomInteger(1, 99);
        const compositionMiddle = this.randomInteger(1, 99);
        const compositionRight = this.randomInteger(1, 99);

        let interimAnswer = compositionLeft;

        this.calculation_ = compositionLeft.toString();
        
        if (this.coinFlip()) {
            this.calculation_ += ` - ${compositionMiddle}`;
            interimAnswer -= compositionMiddle;
        } else {
            this.calculation_ += ` + ${compositionMiddle}`;
            interimAnswer += compositionMiddle;
        }

        if (this.coinFlip()) {
            this.calculation_ += ` - ${compositionRight}`;
            interimAnswer -= compositionRight;
        } else {
            this.calculation_ += ` + ${compositionRight}`;
            interimAnswer += compositionRight;
        }

        this.answer_ = interimAnswer.toString();
    }

    // Returns a random integer between the given |min| (inclusive) and |max| (exclusive).
    randomInteger(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    // Returns either true or false with approximately 50% probability each.
    coinFlip() { return Math.random() >= .5; }
}
