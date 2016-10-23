// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Feature = require('components/feature_manager/feature.js');
const Gang = require('features/gangs/gang.js');

// Functional mock providing the same public API as the `gangs` feature that can be used by other
// features that depend on it and would like to test its behaviour.
class MockGangs extends Feature {
    constructor() {
        super();

        this.gangs_ = {};
    }

    addObserver(observer) {}
    removeObserver(observer) {}

    getGangs() { return Object.values(this.gangs_); }
    getGangForPlayer(player) {
        for (let gang of Object.values(this.gangs_)) {
            if (gang.hasPlayer(player))
                return gang;
        }

        return null;
    }

    createGang({ tag = 'HKO', name = 'Hello Kitty Online', color = null,
                 chatEncryptionExpiry = 0 } = {}) {
        const gangId = Math.floor(Math.random() * 1000000);

        // The |chatEncryptionExpiry| for this function is relative to the current time.
        if (chatEncryptionExpiry)
            chatEncryptionExpiry += Math.floor(server.clock.currentTime() / 1000);

        this.gangs_[gangId] = new Gang({
            id: gangId,
            tag: tag,
            name: name,
            goal: '',
            color: color,
            chatEncryptionExpiry: chatEncryptionExpiry
        });

        return this.gangs_[gangId];
    }
};

exports = MockGangs;
