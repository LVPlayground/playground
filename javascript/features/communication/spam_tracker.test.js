// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { SpamTracker,
         kMessageExpirationTimeSec,
         kMessageLengthCutOff,
         kMessageLimit,
         kMessageRepeatLimit,
         kPlayerWarningIntervalSec } from 'features/communication/spam_tracker.js';

describe('SpamTracker', (it, beforeEach) => {
    let gunther = null;
    let tracker = null;

    beforeEach(() => {
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        tracker = new SpamTracker();
    });

    it('should be able to block excessively long messages', assert => {
        assert.isTrue(tracker.isSpamming(gunther, 'a'.repeat(kMessageLengthCutOff + 1)));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.COMMUNICATION_SPAM_BLOCKED));
    });

    it('should limit the number of spam warnings we send to players', async (assert) => {
        assert.isTrue(tracker.isSpamming(gunther, 'a'.repeat(kMessageLengthCutOff + 1)));
        assert.equal(gunther.messages.length, 1);

        assert.isTrue(tracker.isSpamming(gunther, 'b'.repeat(kMessageLengthCutOff + 1)));
        assert.equal(gunther.messages.length, 1);

        await server.clock.advance(kPlayerWarningIntervalSec * 1000);

        assert.isTrue(tracker.isSpamming(gunther, 'a'.repeat(kMessageLengthCutOff + 1)));
        assert.equal(gunther.messages.length, 2);

        assert.isTrue(tracker.isSpamming(gunther, 'b'.repeat(kMessageLengthCutOff + 1)));
        assert.equal(gunther.messages.length, 2);
    });

    it('should limit the number of messages players can send', async (assert) => {
        function getRandomMessage() { return 'Hello ' + Math.random(); }

        for (let i = 0; i < kMessageLimit; ++i)
            assert.isFalse(tracker.isSpamming(gunther, getRandomMessage()));
        
        assert.isTrue(tracker.isSpamming(gunther, getRandomMessage()));
        assert.equal(gunther.messages.length, 1);

        await server.clock.advance(kMessageExpirationTimeSec * 1000);

        assert.isFalse(tracker.isSpamming(gunther, getRandomMessage()));
        assert.equal(gunther.messages.length, 1);
    });

    it('should limit the number of messages player can repeat', async (assert) => {
        for (let i = 0; i < kMessageRepeatLimit; ++i)
            assert.isFalse(tracker.isSpamming(gunther, 'aaaa'));

        assert.isTrue(tracker.isSpamming(gunther, 'aaaa'));
        assert.isFalse(tracker.isSpamming(gunther, 'bbbb'));

        await server.clock.advance(kMessageExpirationTimeSec * 1000);

        assert.isFalse(tracker.isSpamming(gunther, 'aaaa'));
        assert.isFalse(tracker.isSpamming(gunther, 'bbbb'));
    });
});
