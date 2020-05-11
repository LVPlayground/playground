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

        muteManager.setCommunicationMuted(gunther, true);

        assert.isTrue(muteManager.isCommunicationMuted());
        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0], Message.format(Message.COMMUNICATION_SERVER_MUTED, gunther.name));
        
        gunther.issueMessage('Hello world!');
        assert.equal(messageCount, 1);

        muteManager.setCommunicationMuted(gunther, false);

        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1], Message.format(Message.COMMUNICATION_SERVER_UNMUTED, gunther.name))
        
        gunther.issueMessage('Hello world!');
        assert.equal(messageCount, 2);
    });
    
    it('should be able to control per-player mutes', assert => {

    });
});
