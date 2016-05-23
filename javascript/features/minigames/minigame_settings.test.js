// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MinigameSettings = require('features/minigames/minigame_settings.js');

describe('MinigameSettings', it => {
    it('should throw when constructed with anything but an object-like type', assert => {
        assert.throws(() => new MinigameSettings());
        assert.throws(() => new MinigameSettings(null));
        assert.throws(() => new MinigameSettings(42));
    });

    it('should throw when missing any of the required properties', assert => {
        // Missing the `name` property.
        assert.throws(() => new MinigameSettings({
            command: '/myminigame',
            minimumParticipants: 1,
            maximumParticipants: 4
        }));

        // Missing the `command` property.
        assert.throws(() => new MinigameSettings({
            name: 'My minigame',
            minimumParticipants: 1,
            maximumParticipants: 4
        }));

        // Missing the `minimumParticipants` property.
        assert.throws(() => new MinigameSettings({
            name: 'My minigame',
            command: '/myminigame',
            maximumParticipants: 4
        }));

        // Missing the `maximumParticipants` property.
        assert.throws(() => new MinigameSettings({
            name: 'My minigame',
            command: '/myminigame',
            minimumParticipants: 1
        }));

        // Not missing any properties.
        assert.doesNotThrow(() => new MinigameSettings({
            name: 'My minigame',
            command: '/myminigame',
            minimumParticipants: 1,
            maximumParticipants: 4
        }));
    });

    it('should reflect all settings as expected', assert => {
        const settings = new MinigameSettings({
            name: 'My minigame',
            command: '/myminigame',
            timeout: 42,
            minimumParticipants: 1,
            maximumParticipants: 4,
            enableRespawn: true
        });

        assert.equal(settings.name, 'My minigame');
        assert.equal(settings.command, '/myminigame');
        assert.equal(settings.timeout, 42);
        assert.equal(settings.minimumParticipants, 1);
        assert.equal(settings.maximumParticipants, 4);
        assert.equal(settings.enableRespawn, true);
    });

    it('should have all its properties tested', assert => {
        const settings = new MinigameSettings({
            name: 'My minigame',
            command: '/myminigame',
            minimumParticipants: 1,
            maximumParticipants: 4
        });

        // If this assertion fails, you either added or removed a property from the MinigameSettings
        // object without updating the tests in this file. Please update the tests accordingly.
        assert.equal(Object.getOwnPropertyNames(settings).length, 6);
    });
});
