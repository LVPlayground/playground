// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import IrcChatCommands from 'features/commands/irc_chat_commands.js';

describe('IrcChatCommands', (it, beforeEach, afterEach) => {
    let ircChatCommands = null;

    beforeEach(() => {
        const nuwani = server.featureManager.loadFeature('nuwani');
        ircChatCommands = new IrcChatCommands(() => nuwani);
    });

    afterEach(() => {
        ircChatCommands.dispose();
    });

    it('/crew should not be usable for normal players', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.isTrue(await gunther.issueCommand('/crew test 2'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
                     Message.format(Message.COMMAND_ERROR_INSUFFICIENT_RIGHTS, 'administrators'));
    });

    it('/man should not be usable for administrators', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(await gunther.issueCommand('/man some words'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
                     Message.format(Message.COMMAND_ERROR_INSUFFICIENT_RIGHTS,
                                    'specific people'));
    });

    it('/crew should send a message for administrators to .crew', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const channel = '#LVP.Crew';

        await gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(await gunther.issueCommand('/crew test 2'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
                     Message.format(Message.IRC_CHAT_MESSAGE_SENT, channel, gunther.name,
                                    'test 2'));
    });

    it('/man should send a message for managers to .management', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const channel = '#LVP.Management';

        await gunther.identify();
        gunther.level = Player.LEVEL_MANAGEMENT;

        assert.isTrue(await gunther.issueCommand('/man some words'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
                     Message.format(Message.IRC_CHAT_MESSAGE_SENT, channel, gunther.name,
                                    'some words'));
    });
});
