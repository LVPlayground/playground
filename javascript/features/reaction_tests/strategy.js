// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// A reaction test strategy that's able to create and confirm questions for the reaction test. There
// are several implementations of strategies in the identically named folder.
export class Strategy {
    // Starts a new test provided by this strategy. The question must be determined, and it should
    // be announced to people in-game and available through Nuwani accordingly.
    start(announceFn, nuwani, prize) {
        throw new Error('This method must be overridden by the strategy.');
    }

    // Gets the answer to the current reaction test. May be NULL.
    get answer() { throw new Error('This getter must be overridden by the strategy.'); }

    // Verifies whether the |message| is, or contains, the answer to this reaction test.
    verify(message) {
        throw new Error('This method must be overridden by the strategy.');
    }
}
