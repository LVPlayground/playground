// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Strategy } from 'features/reaction_tests/strategy.js';

import { random } from 'base/random.js';
import { shuffle } from 'base/shuffle.js';

// File that contains the word definitions for scrambled word games.
const kWordDefinitionFile = 'data/scrambled_words.json';

// Utility function to determine whether the given |charCode| should be scrambled.
function shouldScramble(charCode) {
    return (charCode >= 48 && charCode <= 57) || /* numbers */
           (charCode >= 65 && charCode <= 90) || /* upper case */
           (charCode >= 97 && charCode <= 122);  /* lower case */
}

// This strategy works by scrambling the characters in a list of predefined phrases, and requiring
// players to guess the right word. The actual list is defined in |kWordDefinitionFile|.
export class UnscrambleStrategy extends Strategy {
    // How many players should be on the server in order to consider this strategy?
    static kMinimumPlayerCount = 1;

    answer_ = null;
    scrambled_ = null;
    settings_ = null;
    words_ = new Set();

    constructor(settings) {
        super();

        this.settings_ = settings;
    }

    // Gets the answer to the current reaction test. May be NULL.
    get answer() { return this.answer_; }

    // Gets the scrambled answer, primarily for testing purposes.
    get scrambled() { return this.scrambled_; }

    // Initializes the list of words that players should unscramble. Will be called when a test is
    // starting, to avoid doing this too often while running tests.
    ensureWordListInitialized() {
        if (this.words_.size)
            return;

        const words = JSON.parse(readFile(kWordDefinitionFile));
        for (const word of words) {
            if (word.startsWith('__'))
                continue;  // considered as a note/comment, ignore it
            
            this.words_.add(word);
        }
    }

    // Starts a new test provided by this strategy. The question must be determined, and it should
    // be announced to people in-game and available through Nuwani accordingly.
    start(announceFn, nuwani, prize) {
        this.ensureWordListInitialized();

        // Pick a random phrase from the loaded word list.
        this.answer_ = ([ ...this.words_ ][ random(this.words_.size) ]).toUpperCase();
        this.scrambled_ = this.scramble(this.answer_);

        // Announce the test to all in-game participants.
        announceFn(Message.REACTION_TEST_ANNOUNCE_UNSCRAMBLE, this.scrambled_, prize);

        // Announce the test to everyone reading along through Nuwani.
        nuwani().echo('reaction-unscramble', this.scrambled_, prize);
    }

    // Scrambles the given |phrase| and returns the result. We decide which characters are valid to
    // be scrambled, then scramble them, re-compose the word, and return it as a string.
    scramble(phrase) {
        if (phrase.trim() !== phrase)
            console.log(`[reaction test] warning: "${phrase}" has excess spacing.`);
        
        const kStaticPercentage =
            this.settings_().getValue('playground/reaction_test_unscramble_fixed');

        const words = phrase.split(' ');
        const result = [];

        for (const word of words) {
            const characters = [];
            const fixed = new Set();

            // (1) Decide which characters are supposed to be fixed.
            for (let index = 0; index < word.length; ++index) {
                if (random(100) < kStaticPercentage)
                    fixed.add(index);
            }

            // (2) Collect all the characters in the |word|.
            for (let index = 0; index < word.length; ++index) {
                if (!shouldScramble(word.charCodeAt(index)) || fixed.has(index))
                    continue;
                
                characters.push(word.charAt(index));
            }

            const shuffled = shuffle(characters);
            const composed = [];

            // (3) Re-compose the scrambled word.
            for (let index = 0; index < word.length; ++index) {
                if (shouldScramble(word.charCodeAt(index)) && !fixed.has(index))
                    composed.push(shuffled.shift());
                else
                    composed.push(word.charAt(index));
            }

            result.push(composed.join(''));
        }

        // (3) Join the composed word together, then translate to upper case.
        return result.join(' ');
    }

    // Verifies whether the |message| is, or contains, the answer to this reaction test.
    verify(message) {
        return message.toUpperCase().startsWith(this.answer_);
    }
}
