// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Current instance of MockPawnInvoke. Only a single instance may exist at any given time.
let instance = null;

// Mocked version of pawnInvoke() that allows Pawn calls to happen during testing without hitting
// the actual SA-MP server. It powers Assert.prototype.pawnCall().
class MockPawnInvoke {
    constructor() {
        this.calls_ = [];

        instance = this;

        // Store the global `pawnInvoke` function so that we can restore it in dispose().
        this.previousPawnInvoke_ = pawnInvoke;
        this.enable();
    }

    // Returns the latest MockPawnInvoke instance, if any.
    static getInstance() {
        return instance;
    }

    // Gets the Pawn calls that were made during the current test in reverse chronological order.
    get calls() { return this.calls_; }

    // Toggles whether pawnInvoke() should be mocked. The default behaviour in tests is to mock all
    // calls, but there are cases where we actually want to hit the server.
    enable() { pawnInvoke = MockPawnInvoke.prototype.pawnInvoke.bind(this); }
    disable() { pawnInvoke = this.previousPawnInvoke_; }

    // Called instead of the real pawnInvoke() during testing.
    pawnInvoke(fn, signature, ...args) {
        this.calls_.unshift({ fn, signature, args });
        return 1;
    }

    dispose() {
        pawnInvoke = this.previousPawnInvoke_;
        instance = null;
    }
}

export default MockPawnInvoke;
