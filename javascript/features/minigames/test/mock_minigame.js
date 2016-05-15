// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Minigame = require('features/minigames/minigame.js');

// A mocked implementation of something that could be a minigame.
class MockMinigame extends Minigame {
    constructor(settings = {}) {
        super({
            name: settings.name || 'My Minigame'
        });
    }
}

exports = MockMinigame;
