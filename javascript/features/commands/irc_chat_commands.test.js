// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import MockAnnounce from 'features/announce/test/mock_announce.js';
import IrcChatCommands from 'features/commands/irc_chat_commands.js';

describe('IrcChatCommands', (it, beforeEach, afterEach) => {
    let ircChatCommands = null;

    beforeEach(() => {
        const announce = new MockAnnounce();
        ircChatCommands = new IrcChatCommands(() => announce);
    });

    afterEach(() => {
        ircChatCommands.dispose();
    });

    it('/crew should not be usable for normal players', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.isTrue(gunther.issueCommand('/crew test 2'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
                     Message.format(Message.COMMAND_ERROR_INSUFFICIENT_RIGHTS, 'administrators'));
    });

    it('/man should not be usable for administrators', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(gunther.issueCommand('/man some words'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
                     Message.format(Message.COMMAND_ERROR_INSUFFICIENT_RIGHTS,
                                    'specific people'));
    });

    it('/crew should send a message for administrators to .crew', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const channel = '#LVP.Crew';

        gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(gunther.issueCommand('/crew test 2'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
                     Message.format(Message.IRC_CHAT_MESSAGE_SENT, channel, gunther.name,
                                    'test 2'));
    });

    it('/man should send a message for managers to .management', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const channel = '#LVP.Management';

        gunther.identify();
        gunther.level = Player.LEVEL_MANAGEMENT;

        assert.isTrue(gunther.issueCommand('/man some words'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
                     Message.format(Message.IRC_CHAT_MESSAGE_SENT, channel, gunther.name,
                                    'some words'));
    });

    it('/man should send a message for RCON admins to .management', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const channel = '#LVP.Management';

        assert.isFalse(gunther.isRegistered());
        assert.equal(gunther.level, Player.LEVEL_PLAYER);

        gunther.setRconAdmin(true);

        assert.isTrue(gunther.issueCommand('/man some words'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
                     Message.format(Message.IRC_CHAT_MESSAGE_SENT, channel, gunther.name,
                                    'some words'));
    });
});
