// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Provides native functions to Pawn for the purpose of displaying announcement messages. This makes
// sure that Pawn continues to have that ability until all users have been migrated over.
export class AnnounceNatives {
    #feature_ = null;

    constructor(feature) {
        this.#feature_ = feature;

        provideNative(
            'AnnounceNewsMessage', 's', AnnounceNatives.prototype.announceNewsMessage.bind(this));
    }

    // native AnnounceNewsMessage(const message[]);
    announceNewsMessage(message) {
        if (typeof message === 'string' && message.length)
            this.#feature_.broadcastNews(message);

        return 1;
    }

    dispose() {
        provideNative('AnnounceNewsMessage', 's', () => 0);
    }
}
