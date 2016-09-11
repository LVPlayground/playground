// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// This class is responsible for exposing an API for communication to Pawn in the form of natives.
class CommunicationNatives {
    constructor(manager) {
        this.manager_ = manager;

        // native bool: IsCommunicationMuted();
        provideNative(
            'IsCommunicationMuted', '' /* arguments */,
            CommunicationNatives.prototype.isCommunicationMuted.bind(this));
    }

    // Returns whether all communication on the server should be muted.
    isCommunicationMuted() {
        return this.manager_.isCommunicationMuted() ? 1 : 0;
    }

    dispose() {
        provideNative('IsCommunicationMuted', '', () => 0);
    }
}

exports = CommunicationNatives;
