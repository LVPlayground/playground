// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('NewsManager', (it, beforeEach) => {
    let gunther = null;
    let manager = null;
    let settings = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('announce');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        manager = feature.newsManager_;
        settings = server.featureManager.loadFeature('settings');
    });

    it('should be able to display and time out news messages', async (assert) => {
        const kMessages = manager.textDrawsForTesting.length;
        const kMessageTimeoutMs = settings.getValue('playground/news_message_onscreen_sec') * 1000;
        const kShardedTimeMs = kMessageTimeoutMs / 2;

        assert.isAbove(kMessages, 2);

        // (1) All messages should start in an empty state by default.
        for (let index = 0; index < kMessages; ++index)
            assert.equal(manager.textDrawsForTesting[index].text, '_');

        // (2) When a message is shown, it should be added as the first message.
        manager.announceNewsMessage('Hello, world!');

        assert.equal(manager.textDrawsForTesting[0].text, 'Hello, world!');
        for (let index = 1; index < kMessages; ++index)
            assert.equal(manager.textDrawsForTesting[index].text, '_');

        await server.clock.advance(kShardedTimeMs);

        // (3) When another message is shown, it should be added as the second message.
        manager.announceNewsMessage('Howdy mate!');

        assert.equal(manager.textDrawsForTesting[1].text, 'Howdy mate!');
        assert.equal(manager.textDrawsForTesting[0].text, 'Hello, world!');

        for (let index = 2; index < kMessages; ++index)
            assert.equal(manager.textDrawsForTesting[index].text, '_');

        await server.clock.advance(kShardedTimeMs);

        // (4) Display |kMessages-1| more messages. The oldest message should be removed.
        for (let message = 0; message < kMessages - 1; ++message)
            manager.announceNewsMessage(`Gulp message ${message + 1}...`);

        assert.equal(manager.textDrawsForTesting[1].text, 'Gulp message 1...');
        assert.equal(manager.textDrawsForTesting[0].text, 'Howdy mate!');

        // (5) Wait for the |kShardedTimeMs| again. The oldest message should noe bw removed.
        await server.clock.advance(kShardedTimeMs);

        for (let message = 0; message < kMessages - 1; ++message) {
            assert.equal(
                manager.textDrawsForTesting[message].text, `Gulp message ${message + 1}...`);
        }

        assert.equal(manager.textDrawsForTesting[kMessages - 1].text, '_');

        // (6) Wait for the |kShardedTime| again. Now all messages should be gone.
        await server.clock.advance(kShardedTimeMs);

        for (let message = 0; message < kMessages; ++message)
            assert.equal(manager.textDrawsForTesting[message].text, '_');
    });

    it('should be able to sanitize news messages', assert => {
        // Test the individual requirements
        assert.equal(manager.sanitizeMessage('hello '), 'hello');
        assert.equal(manager.sanitizeMessage('h~ello~'), 'hello');
        assert.equal(manager.sanitizeMessage('h~e~llo'), 'hello');
        assert.equal(manager.sanitizeMessage('h~b~ello'), 'h~b~ello');

        assert.equal(manager.sanitizeMessage('[~k~~GO_LEFT~]'), '[~k~~GO_LEFT~]');
        assert.equal(manager.sanitizeMessage('[~k~~SHORT~]'), '[kSHORT]');
        assert.equal(
            manager.sanitizeMessage('[~k~~VEHICLE_FIREWEAPON_ALT~]'),
            '[~k~~VEHICLE_FIREWEAPON_ALT~]');
        assert.equal(
            manager.sanitizeMessage('[~k~~SOME_SUPER_LONG_KEY_NAME~]'),
            '[kSOME_SUPER_LONG_KEY_NAME]');
    });
});
