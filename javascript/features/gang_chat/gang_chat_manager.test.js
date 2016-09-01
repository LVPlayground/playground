// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Communication = require('features/communication/communication.js');
const GangChatManager = require('features/gang_chat/gang_chat_manager.js');
const MockGangs = require('features/gangs/test/mock_gangs.js');

describe('GangChatManager', (it, beforeEach, afterEach) => {
    let gangs = null;
    let manager = null;

    beforeEach(() => {
        gangs = new MockGangs();
        manager = new GangChatManager(() => gangs, null /* announce */, new Communication());
    });

    afterEach(() => manager.dispose());

    it('should ignore messages that are not meant for gang chat', assert => {
        const player = server.playerManager.getById(0 /* Gunther */);

        assert.isFalse(player.issueMessage(''));
        assert.isFalse(player.issueMessage('Hello, world!'));
        assert.isFalse(player.issueMessage('!'));
        assert.isFalse(player.issueMessage('!!message'));
        assert.isFalse(player.issueMessage('!!! omg'));
    });

    it('should send a warning message if the player is not in a gang', assert => {
        const player = server.playerManager.getById(0 /* Gunther */);

        assert.isNull(gangs.getGangForPlayer(player));
        assert.isTrue(player.issueMessage('!hello'));

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

        assert.isTrue(player.issueMessage('!  hello  '));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], expectedMessage);

        assert.equal(russell.messages.length, 0);

        player.clearMessages();

        gang.addPlayer(russell);

        assert.isTrue(player.issueMessage('!  hello  '));

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
        russell.messageLevel = 2 /* see gang chat */;

        const expectedMessage =
            Message.format(Message.GANG_CHAT, gang.tag, player.id, player.name, 'hello');

        assert.isFalse(gang.hasPlayer(russell));
        assert.isTrue(player.issueMessage('!  hello  '));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], expectedMessage);

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], expectedMessage);

        gang.addPlayer(russell);

        player.clearMessages();
        russell.clearMessages();

        assert.isTrue(player.issueMessage('!  hello  '));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], expectedMessage);

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], expectedMessage);
    });

    it('should skip administrators if their message level is lower than two', assert => {
        const player = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        const gang = gangs.createGang();
        gang.addPlayer(player);

        russell.level = Player.LEVEL_ADMINISTRATOR;
        russell.messageLevel = 0 /* do not see gang chat */;

        const expectedMessage =
            Message.format(Message.GANG_CHAT, gang.tag, player.id, player.name, 'hello');

        assert.isFalse(gang.hasPlayer(russell));
        assert.isTrue(player.issueMessage('!  hello  '));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], expectedMessage);

        assert.equal(russell.messages.length, 0);
    });

    it('should make an announcement when somebody buys Seti @ Home', assert => {
        const player = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        const gang = gangs.createGang();
        gang.addPlayer(player);

        manager.onSetiOwnershipChange({ playerid: russell.id });

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0],
                      Message.format(Message.GANG_CHAT_SPY, russell.name, russell.id));

        assert.equal(russell.messages.length, 0);

        player.clearMessages();

        const expectedMessage =
            Message.format(Message.GANG_CHAT, gang.tag, player.id, player.name, 'hello');

        assert.isTrue(player.issueMessage('!hello'));

        assert.isTrue(gang.hasPlayer(player));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], expectedMessage);

        assert.isFalse(gang.hasPlayer(russell));
        assert.equal(russell.level, Player.LEVEL_PLAYER);
        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], expectedMessage);
    });

    it('should show an error when sending a remote message to an invalid gang', assert => {
        const player = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        const gang = gangs.createGang({ tag: 'HKO' });
        gang.addPlayer(player);

        russell.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(russell.issueMessage('!!OMG hello'));

        assert.isTrue(gang.hasPlayer(player));
        assert.equal(player.messages.length, 0);

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], Message.format(Message.GANG_CHAT_NO_GANG_FOUND, 'OMG'));
    });

    it('should show usage information to admins using two exclamation marks', assert => {
        const player = server.playerManager.getById(0 /* Gunther */);
        player.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(player.issueMessage('!!'));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.GANG_CHAT_REMOTE_USAGE);
    });

    it('should allow administrators to send remote messages to gangs', assert => {
        const player = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        const gang = gangs.createGang({ tag: 'hKo' });
        gang.addPlayer(player);

        russell.level = Player.LEVEL_ADMINISTRATOR;
        russell.messageLevel = 0 /* do not see gang chat */;

        assert.isTrue(russell.issueMessage('!!HKO hello'));

        const expectedMessage =
            Message.format(Message.GANG_CHAT_REMOTE, gang.tag, russell.id, russell.name, 'hello');

        assert.isTrue(gang.hasPlayer(player));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], expectedMessage);

        assert.isFalse(gang.hasPlayer(russell));
        assert.isBelow(russell.messageLevel, 2);

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], expectedMessage);
    });

    it('should ignore three exclamation marks for administrators as well', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isFalse(gunther.issueMessage('!!!what happened'));
    });
});
