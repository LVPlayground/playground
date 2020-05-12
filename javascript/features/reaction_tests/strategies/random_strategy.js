// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Strategy } from 'features/reaction_tests/strategy.js';

// This strategy works by creating a string of random characters which must be repeated by the
// player in order to win. There is a little bit of variety in phrase length and character use.
export class RandomStrategy extends Strategy {
    // How many players should be on the server in order to consider this strategy?
    static kMinimumPlayerCount = 1;

    // Minimum and maximum lengths, in characters, of a generated random string.
    static kMinimumLength = 7;
    static kMaximumLength = 9;

    // The alphabet out of which random strings will be generated.
    static kAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456798ABCDEFGHJKLMNPQRSTUVWXYZ';

    answer_ = null;

    // Gets the answer to the current reaction test. May be NULL.
    get answer() { return this.answer_; }

    // Starts a new test provided by this strategy. The question must be determined, and it should
    // be announced to people in-game and available through Nuwani accordingly.
    start(announceFn, nuwani, prize) {
        const minimum = RandomStrategy.kMinimumLength;
        const maximum = RandomStrategy.kMaximumLength;

        const length = Math.floor(Math.random() * (maximum - minimum)) + minimum;

        this.answer_ = '';
        for (let character = 0; character < length; ++character) {
            this.answer_ += RandomStrategy.kAlphabet[
                                Math.floor(Math.random() * RandomStrategy.kAlphabet.length)];
        }

        // Announce the test to all in-game participants.
        announceFn(Message.REACTION_TEST_ANNOUNCE_REPEAT, this.answer_, prize);

        // Announce the test to everyone reading along through Nuwani.
        nuwani().echo('reaction-repeat', this.answer_, prize);
    }

    // Verifies whether the |message| is, or contains, the answer to this reaction test.
    verify(message) {
        return message.toUpperCase() === this.answer_;
    }
}
