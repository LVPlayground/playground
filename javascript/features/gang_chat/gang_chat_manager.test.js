// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Communication from 'features/communication/communication.js';
import GangChatManager from 'features/gang_chat/gang_chat_manager.js';
import GangTester from 'features/gangs/test/gang_tester.js';

describe('GangChatManager', (it, beforeEach, afterEach) => {
    let gangs = null;
    let manager = null;

    beforeEach(() => {
        server.featureManager.loadFeature('communication');

        const communication =
            server.featureManager.createDependencyWrapperForFeature('communication');

        gangs = server.featureManager.loadFeature('gangs');
        manager = new GangChatManager(() => gangs, null /* announce */, communication);
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

    it('should distribute the message to the online members', async(assert) => {
        const player = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        player.identify();

        const gang = await GangTester.createGang(player);

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

    it('should distribute the messages to administrators', async(assert) => {
        const player = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        player.identify();

        const gang = await GangTester.createGang(player);

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

    it('should skip administrators if their message level is lower than two', async(assert) => {
        const player = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        player.identify();

        const gang = await GangTester.createGang(player);

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

    it('should make an announcement when somebody buys Seti @ Home', async(assert) => {
        const player = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        player.identify();

        const gang = await GangTester.createGang(player);

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

    it('should show an error when sending a remote message to an invalid gang', async(assert) => {
        const player = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        player.identify();

        const gang = await GangTester.createGang(player);

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

    it('should allow administrators to send remote messages to gangs', async(assert) => {
        const player = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        player.identify();

        const gang = await GangTester.createGang(player, { tag: 'hKo' });

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

    it('should warn the new Seti@Home owner of gangs having chat encryption', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        gunther.identify();

        const gang = await GangTester.createGang(gunther, { chatEncryptionExpiry: 86400 });

        manager.onSetiOwnershipChange({ playerid: russell.id });

        assert.equal(gunther.messages.length, 0);

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], Message.format(Message.GANG_CHAT_SPY_ENC, gang.tag));
    });

    it('should identify gang chat messages that are encrypted', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify();

        const gang =
            await GangTester.createGang(gunther, { chatEncryptionExpiry: 0 /* not encrypted */ });

        assert.isTrue(gunther.issueMessage('!unencrypted'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.GANG_CHAT, gang.tag, gunther.id,
                                                         gunther.name, 'unencrypted'));

        gunther.clearMessages();

        // Fake the |gang| having purchased a day worth of message encryption.
        gang.chatEncryptionExpiry = Math.floor(server.clock.currentTime() / 1000) + 86400;

        assert.isTrue(gunther.issueMessage('!encrypted'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.GANG_CHAT_ENCRYPTED, gang.tag,
                                                         gunther.id, gunther.name, 'encrypted'));
    });

    it('should not send encrypted gang chat messages to the Seti@Home owner', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        gunther.identify();

        const gang = await GangTester.createGang(gunther, { chatEncryptionExpiry: 86400 });

        manager.onSetiOwnershipChange({ playerid: russell.id });

        assert.equal(gunther.messages.length, 0);

        assert.equal(russell.messages.length, 1);
        russell.clearMessages();

        assert.isTrue(gunther.issueMessage('!this message is encrypted'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(russell.messages.length, 0);
    });

    it('should ghost messages if the sender has been isolated', async assert => {
        const player = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        player.identify();
        player.syncedData.setIsolated(true);

        const gang = await GangTester.createGang(player);
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

        assert.equal(russell.messages.length, 0);
    });
});
