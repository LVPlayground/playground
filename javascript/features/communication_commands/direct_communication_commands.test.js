// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('DirectCommunicationCommands', (it, beforeEach) => {
    let gunther = null;
    let russell = null;

    let visibilityManager = null;

    beforeEach(async() => {
        server.featureManager.loadFeature('communication_commands');

        const communication = server.featureManager.loadFeature('communication');

        visibilityManager = communication.visibilityManager_;

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        russell.level = Player.LEVEL_ADMINISTRATOR;

        await russell.identify();
    });

    it('should be able to send messages to people on IRC', async (assert) => {
        const nuwani = server.featureManager.loadFeature('nuwani');

        // (1) It doesn't work if |gunther| is not a VIP.
        assert.isTrue(await gunther.issueCommand('/ircpm Nuwani Hey man!'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.COMMUNICATION_IRCPM_NO_VIP));

        gunther.setVip(true);

        // (2) It's subject to the regular spam and message filters.
        assert.isTrue(await gunther.issueCommand('/ircpm Nuwani Hey George!'));
        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1],
            Message.format(Message.COMMUNICATION_PM_IRC_SENDER, 'Nuwani', 'Hey Geroge!'));

        assert.equal(nuwani.messagesForTesting.length, 2);
        assert.deepEqual(nuwani.messagesForTesting[0], {
            tag: 'chat-irc-notice',
            params: [
                'Nuwani',
                gunther.name,
                gunther.id,
                'Hey Geroge!',
            ]
        });

        // (3) It shares the message with administrators.
        assert.equal(russell.messages.length, 1);
        assert.equal(
            russell.messages[0],
            Message.format(Message.COMMUNICATION_IRCPM_ADMIN, gunther.name, gunther.id, 'Nuwani',
                           'Hey Geroge!'));

        assert.deepEqual(nuwani.messagesForTesting[1], {
            tag: 'chat-private-to-irc',
            params: [
                gunther.name,
                gunther.id,
                'Nuwani',
                'Hey Geroge!',
            ]
        });
    });

    it('should be able to reply to IRC messages', async (assert) => {
        gunther.setVip(true);

        dispatchEvent('ircmessage', {
            playerid: gunther.id,
            username: 'Nuwani',
        });

        assert.isTrue(await gunther.issueCommand('/r Hey George!'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.COMMUNICATION_PM_IRC_SENDER, 'Nuwani', 'Hey Geroge!'));
    });

    it('should be possible to send regular private messages', async (assert) => {
        const lucy = server.playerManager.getById(/* Lucy= */ 2);
        const nuwani = server.featureManager.loadFeature('nuwani');

        // (1) It's not possible to send a message to oneself.
        assert.isTrue(await gunther.issueCommand('/pm Gunther Hello!'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.COMMUNICATION_SPM_SELF));

        // (2) Players can send private messages to each other.
        assert.isTrue(await gunther.issueCommand('/pm Lucy Hi'));
        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1],
            Message.format(Message.COMMUNICATION_PM_SENDER, lucy.name, lucy.id, 'Hi'));

        assert.equal(lucy.messages.length, 1);
        assert.equal(
            lucy.messages[0],
            Message.format(Message.COMMUNICATION_PM_RECEIVER, gunther.name, gunther.id, 'Hi'));

        // (3) Players can reply with the `/r` command.
        assert.isTrue(await lucy.issueCommand('/r notgeorge'));
        assert.equal(gunther.messages.length, 3);
        assert.equal(
            gunther.messages[2],
            Message.format(Message.COMMUNICATION_PM_RECEIVER, lucy.name, lucy.id, 'notgeroge'));

        assert.equal(lucy.messages.length, 2);
        assert.equal(
            lucy.messages[1],
            Message.format(Message.COMMUNICATION_PM_SENDER, gunther.name, gunther.id, 'notgeroge'));

        // (4) Administrators are appropriately informed.
        assert.equal(russell.messages.length, 2);
        assert.equal(
            russell.messages[1],
            Message.format(Message.COMMUNICATION_PM_ADMIN, lucy.name, lucy.id, gunther.name,
                           gunther.id, 'notgeroge'));

        // (5) People watching on IRC are appropriately informed.
        assert.equal(nuwani.messagesForTesting.length, 2);
        assert.deepEqual(nuwani.messagesForTesting[1], {
            tag: 'chat-private',
            params: [
                lucy.name,
                lucy.id,
                gunther.name,
                gunther.id,
                'notgeroge',
            ],
        });
    });

    it('sending and receiving private messages honors the ignored list', async (assert) => {
        assert.isFalse(visibilityManager.isPlayerOnIgnoreList(gunther, russell));
        
        visibilityManager.addPlayerToIgnoreList(gunther, russell);
        assert.isTrue(visibilityManager.isPlayerOnIgnoreList(gunther, russell));

        // (1) Gunther is not allowed to send messages to Russell
        assert.isTrue(await gunther.issueCommand('/pm Russell lolm8'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.COMMUNICATION_PM_IGNORED));

        // (2) Gunther does not receive messages from Russell
        assert.isTrue(await russell.issueCommand('/pm Gunther yam8'));
        assert.equal(russell.messages.length, 1);
        assert.equal(
            russell.messages[0],
            Message.format(Message.COMMUNICATION_PM_SENDER, gunther.name, gunther.id, 'yam8'));

        assert.equal(gunther.messages.length, 1);  // unchanged
    });

    it('cannot send to muted targets unless sender is an admin', async (assert) => {
        // Set up by Russell muting themselves
        assert.isTrue(await russell.issueCommand('/mute Russell 5'));

        // (1) It should not be possible for Gunther to PM Russell who's muted
        assert.isTrue(await gunther.issueCommand('/pm Russell Hello world'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.COMMUNICATION_PM_TARGET_MUTED, russell.name, russell.id,
                           '5 minutes'));
    });

    it('should be able to send secret private messages', async (assert) => {
        gunther.level = Player.LEVEL_MANAGEMENT;

        await gunther.identify();

        // (1) It's not possible to send a secret PM to oneself.
        assert.isTrue(await gunther.issueCommand('/spm Gunther Hey man!'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.COMMUNICATION_SPM_SELF));

        // (2) Players can send secret PMs to each other.
        assert.isTrue(await gunther.issueCommand('/spm Russell Heya!'));
        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1],
            Message.format(Message.COMMUNICATION_SPM_SENDER, russell.name, russell.id, 'Heya!'));

        assert.equal(russell.messages.length, 1);
        assert.equal(
            russell.messages[0],
            Message.format(Message.COMMUNICATION_SPM_RECEIVER, gunther.name, gunther.id, 'Heya!'));

        // (3) Players can respond with the `/r` command.
        assert.isTrue(await russell.issueCommand('/r Yo'));
        assert.equal(gunther.messages.length, 3);
        assert.equal(
            gunther.messages[2],
            Message.format(Message.COMMUNICATION_SPM_RECEIVER, russell.name, russell.id, 'Yo'));

        assert.equal(russell.messages.length, 2);
        assert.equal(
            russell.messages[1],
            Message.format(Message.COMMUNICATION_SPM_SENDER, gunther.name, gunther.id, 'Yo'));
    });

    it('requires interaction before players are able to use /r', async (assert) => {
        assert.isTrue(await gunther.issueCommand('/r Hey man!'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.COMMUNICATION_REPLY_NONE));

        // The behaviour of `/r` is tested in the tests covering the other commands that could lead
        // to responses, e.g. `/pm` and `/spm`.
    });

    it('should be able to send messages to #LVP.Crew and #LVP.Management', async (assert) => {
        const nuwani = server.featureManager.loadFeature('nuwani');

        gunther.level = Player.LEVEL_MANAGEMENT;

        // (1) Ability to send messages to #LVP.Crew.
        assert.isTrue(await gunther.issueCommand('/crew hey men!'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.COMMUNICATION_CREW_MESSAGE, '#LVP.Crew', 'hey men!'));

        assert.equal(nuwani.messagesForTesting.length, 1);
        assert.deepEqual(nuwani.messagesForTesting[0], {
            tag: 'chat-irc',
            params: [
                '#LVP.Crew',
                gunther.name,
                gunther.id,
                'hey men!',
            ]
        });

        // (2) Ability to send messages to #LVP.Management.
        assert.isTrue(await gunther.issueCommand('/man hai men'));
        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1],
            Message.format(Message.COMMUNICATION_CREW_MESSAGE, '#LVP.Management', 'hai men'));

        assert.equal(nuwani.messagesForTesting.length, 2);
        assert.deepEqual(nuwani.messagesForTesting[1], {
            tag: 'chat-irc',
            params: [
                '#LVP.Management',
                gunther.name,
                gunther.id,
                'hai men',
            ]
        });
    });
});
