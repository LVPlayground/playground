// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MuteManager } from 'features/communication/mute_manager.js';

describe('MuteManager', (it, beforeEach) => {
    let gunther = null;
    let manager = null;
    let muteManager = null;
    let russell = null;

    beforeEach(() => {
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        manager = server.featureManager.loadFeature('communication').manager_;
        muteManager = server.featureManager.loadFeature('communication').muteManager_;
        russell = server.playerManager.getById(/* Russell= */ 0);
    });

    it('should be able to control server-wide mute management', assert => {
        let messageCount = 0;

        manager.addDelegate(new class {
            onPlayerText(player, message) {
                messageCount++;
                return true;  // handled
            }
        });

        assert.isFalse(muteManager.isCommunicationMuted());
        assert.equal(gunther.messages.length, 0);
        assert.equal(messageCount, 0);

        gunther.issueMessage('Hello world!');
        assert.equal(messageCount, 1);

        muteManager.setCommunicationMuted(true);
        assert.isTrue(muteManager.isCommunicationMuted());

        gunther.issueMessage('Hello world!');
        assert.equal(messageCount, 1);

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0], Message.format(Message.COMMUNICATION_SERVER_MUTE_BLOCKED));

        muteManager.setCommunicationMuted(false);
        assert.isFalse(muteManager.isCommunicationMuted());

        gunther.issueMessage('Hello world!');
        assert.equal(messageCount, 2);
    });
    
    it('should be able to control per-player mutes', async (assert) => {
        let messageCount = 0;

        manager.addDelegate(new class {
            onPlayerText(player, message) {
                messageCount++;
                return true;  // handled
            }
        });

        assert.equal(messageCount, 0);

        gunther.issueMessage('Hello world!');
        assert.equal(messageCount, 1);

        muteManager.mutePlayer(gunther, 300);
        assert.closeTo(muteManager.getPlayerRemainingMuteTime(gunther), 300, 5);

        gunther.issueMessage('Hello world!');
        assert.equal(messageCount, 1);

        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], 'message has been blocked');
        
        await server.clock.advance(300 * 1000);

        assert.isFalse(!!muteManager.getPlayerRemainingMuteTime(gunther));

        gunther.issueMessage('Hello world!');
        assert.equal(messageCount, 2);

        muteManager.mutePlayer(gunther, 200);
        assert.closeTo(muteManager.getPlayerRemainingMuteTime(gunther), 200, 5);

        muteManager.unmutePlayer(gunther);
        assert.isFalse(!!muteManager.getPlayerRemainingMuteTime(gunther));
    });
});
