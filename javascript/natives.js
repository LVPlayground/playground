// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Implementation of the native functions that are provided to Pawn through JavaScript.
class Natives {
    constructor() {
        provideNative('TestFunction', 'i', Natives.prototype.testFunction.bind(this));

        // NOTE: It's not yet possible to add new natives to this list without updating and
        // rebuilding JavaScript plugin. While planned, please do talk to Russell for now.
    }

    // TestFunction(value)
    testFunction(value) {
        console.log(value);
    }
}

exports = Natives;
