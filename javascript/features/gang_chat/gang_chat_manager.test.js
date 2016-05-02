// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const GangChatManager = require('features/gang_chat/gang_chat_manager.js');
const MockGangs = require('features/gangs/test/mock_gangs.js');
const MockServer = require('test/mock_server.js');

describe('GangChatManager', (it, beforeEach, afterEach) => {
    let gangs = null;
    let manager = null;

    // Bind to the mock server because this feature needs online players.
    MockServer.bindTo(beforeEach, afterEach, () => {
        gangs = new MockGangs();
        manager = new GangChatManager(gangs);

    }, () => manager.dispose());

    // Utility function to send a |message| by |player|. Returns whether the event was canceled.
    function sendChat(player, message) {
        let canceled = false;
        manager.onPlayerText({
            preventDefault() { canceled = true; },

            playerid: player.id,
            text: message
        });

        return canceled;
    }

    it('should ignore messages that are not meant for gang chat', assert => {
        const player = server.playerManager.getById(0 /* Gunther */);

        assert.isFalse(sendChat(player, ''));
        assert.isFalse(sendChat(player, 'Hello, world!'));
        assert.isFalse(sendChat(player, '!!! omg'));
    });

    it('should send a warning message if the player is not in a gang', assert => {
        const player = server.playerManager.getById(0 /* Gunther */);

        assert.isNull(gangs.getGangForPlayer(player));
        assert.isTrue(sendChat(player, '!hello'));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANG_CHAT_NO_GANG);
    });

    it('should distribute the message to the online members', assert => {
        const player = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        const gang = gangs.createGang();
        gang.addPlayer(player);

        const expectedMessage =
            Message.format(Message.GANG_CHAT, gang.tag, player.id, player.name, 'hello');

        assert.isTrue(sendChat(player, '!  hello  '));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], expectedMessage);

        assert.equal(russell.messages.length, 0);

        player.clearMessages();

        gang.addPlayer(russell);

        assert.isTrue(sendChat(player, '!  hello  '));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], expectedMessage);

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], expectedMessage);
    });

    it('should distribute the messages to administrators', assert => {
        const player = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        const gang = gangs.createGang();
        gang.addPlayer(player);

        russell.level = Player.LEVEL_ADMINISTRATOR;

        const expectedMessage =
            Message.format(Message.GANG_CHAT, gang.tag, player.id, player.name, 'hello');

        assert.isFalse(gang.hasPlayer(russell));
        assert.isTrue(sendChat(player, '!  hello  '));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], expectedMessage);

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], expectedMessage);

        gang.addPlayer(russell);

        player.clearMessages();
        russell.clearMessages();

        assert.isTrue(sendChat(player, '!  hello  '));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], expectedMessage);

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], expectedMessage);
    });
});
