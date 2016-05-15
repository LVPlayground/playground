// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommunicationManager = require('features/communication/communication_manager.js');

describe('CommunicationManager', (it, beforeEach, afterEach) => {
    let gunther;

    // A new CommunicationManager instance will be created for each test.
    let communicationManager = null;

    beforeEach(() => {
        gunther = server.playerManager.getById(0 /* Gunther */);
        communicationManager = new CommunicationManager();
    });

    afterEach(() => communicationManager.dispose());

    it('should ignore messages when there are no delegates', assert => {
        assert.isFalse(gunther.issueMessage('Hello'));
    });

    it('should call all delegates on chat, ignore when none handles it', assert => {
        let chatPlayer = null;
        let chatMessage = null;

        class MyDelegate {
            onPlayerText(player, message) {
                chatPlayer = player;
                chatMessage = message;
                return false;  // do not handle the message
            }
        }

        communicationManager.addDelegate(new MyDelegate());

        assert.isFalse(gunther.issueMessage('Hello'));

        assert.equal(chatPlayer, gunther);
        assert.equal(chatMessage, 'Hello');
    });

    it('should throw when the delegate does not return a boolean', assert => {
        class MyDelegate {
            onPlayerText(player, message) {}
        }

        communicationManager.addDelegate(new MyDelegate());

        assert.throws(() => {
            communicationManager.onPlayerText({
                playerid: gunther.id,
                text: 'Hello'
            });
        });
    });

    it('should call all delegates on chat, prevent default when one of them handles it', assert => {
        let chatPlayer = null;
        let chatMessage = null;

        class MyDelegate {
            onPlayerText(player, message) {
                chatPlayer = player;
                chatMessage = message;
                return true;  // handle the message
            }
        }

        communicationManager.addDelegate(new MyDelegate());

        assert.isTrue(gunther.issueMessage('Hello'));

        assert.equal(chatPlayer, gunther);
        assert.equal(chatMessage, 'Hello');
    });
});
