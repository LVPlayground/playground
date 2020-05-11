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

    // Returns the answer 
    getAnswer() {
        throw new Error('This method must be overridden by the strategy.');
    }
}
