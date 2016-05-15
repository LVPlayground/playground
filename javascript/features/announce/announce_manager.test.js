// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const AnnounceManager = require('features/announce/announce_manager.js');

describe('AnnounceManager', (it, beforeEach, afterEach) => {
    let announceManager = null;
    let ircMessages = [];

    beforeEach(() => {
        announceManager = new AnnounceManager(message => {
            ircMessages.push(message);
        });

        ircMessages = [];
    });

    it('should announce new minigames to players', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const name = 'Hello Kitty Playground';
        const command = '/hko';
        const price = 25000;

        announceManager.announceMinigame(gunther, name, command, price);

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
                     Message.format(Message.ANNOUNCE_MINIGAME, name, command, price));

        assert.deepEqual(ircMessages, [
            '[announce] ' + Message.format(Message.ANNOUNCE_MINIGAME_IRC, gunther.name, gunther.id,
                                           name)
        ]);
    });

    it('should announce minigame participation to players', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        const name = 'Hello Kitty Playground';
        const command = '/hko';

        announceManager.announceMinigameParticipation(gunther, name, command);

        assert.equal(gunther.messages.length, 0);

        // TODO(Russell): Test the message through the news controller when possible.

        assert.deepEqual(ircMessages, [
            '[announce] ' + Message.format(Message.ANNOUNCE_MINIGAME_JOINED_IRC,
                                           gunther.name, gunther.id, name)
        ]);
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
