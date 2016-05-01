// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const AnnounceManager = require('features/announce/announce_manager.js');
const MockServer = require('test/mock_server.js');

describe('AnnounceManager', (it, beforeEach, afterEach) => {
    let announceManager = null;
    let ircMessages = [];

    MockServer.bindTo(beforeEach, afterEach, server => {
        announceManager = new AnnounceManager(server.playerManager, message => {
            ircMessages.push(message);
        });

        ircMessages = [];
    });

    it('should distribute messages to players', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        announceManager.announceToPlayers('Hello, world!');

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.ANNOUNCE_ALL, 'Hello, world!'));

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], Message.format(Message.ANNOUNCE_ALL, 'Hello, world!'));

        assert.equal(ircMessages.length, 1);
        assert.equal(ircMessages[0], '[announce] Hello, world!');
    });

    it('should distribute messages to administrators', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        russell.level = Player.LEVEL_ADMINISTRATOR;

        announceManager.announceToAdministrators('Hello, admins!');

        assert.equal(gunther.messages.length, 0);

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0],
                     Message.format(Message.ANNOUNCE_ADMINISTRATORS, 'Hello, admins!'));

        assert.equal(ircMessages.length, 1);
        assert.equal(ircMessages[0], '[admin] Hello, admins!');
    });

    it('should distribute messages to IRC', assert => {
        announceManager.announceToIRC('tag');
        announceManager.announceToIRC('hello', 'world', 25, [1, 2, 3], {});

        assert.deepEqual(ircMessages, [
            '[tag] ',
            '[hello] world 25 1,2,3 [object Object]'
        ]);
    });
});
