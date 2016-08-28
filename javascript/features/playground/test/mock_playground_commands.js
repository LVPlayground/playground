// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MockAnnounce = require('features/announce/test/mock_announce.js');
const PlaygroundAccessTracker = require('features/playground/playground_access_tracker.js');
const PlaygroundCommands = require('features/playground/playground_commands.js');

// The MockPlaygroundCommands class is exactly the same as the PlaygroundCommands class, with the
// exception that the arguments required for the constructor are automatically injected.
class MockPlaygroundCommands extends PlaygroundCommands {
    constructor() {
        const mockAnnounce = new MockAnnounce();
        super(null /* manager */, new PlaygroundAccessTracker(), () => mockAnnounce);
    }
};

exports = MockPlaygroundCommands;
