// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AdministratorChannel } from 'features/communication/channels/administrator_channel.js';

describe('CommunicationManager', (it, beforeEach, afterEach) => {
    let gunther = null;
    let manager = null;
    let muteManager = null;
    let nuwani = null;
    let russell = null;

    beforeEach(() => {
        const communication = server.featureManager.loadFeature('communication');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        manager = communication.manager_;
        muteManager = communication.muteManager_;
        nuwani = server.featureManager.loadFeature('nuwani');
        russell = server.playerManager.getById(/* Russell= */ 1);
    });

    it('should block messages until the registered player identifies', assert => {
        const messages = [];

        manager.addDelegate(new class {
            onPlayerText(player, message) {
                messages.push(message);
                return true;  // handled
            }
        });

        // Hack hack hack :)
        gunther.account.isRegistered_ = true;
        gunther.account.isIdentified_ = false;

        assert.isTrue(gunther.issueMessage('Hello everyone!'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.COMMUNICATION_LOGIN_BLOCKED));
    });

    it('integrates with the spam tracker', assert => {
        const excessivelyLongMessage = 'a'.repeat(1024);

        assert.equal(gunther.messages.length, 0);
        assert.isTrue(gunther.issueMessage(excessivelyLongMessage));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.COMMUNICATION_SPAM_BLOCKED));
    });

    it('integrates with the message filter', assert => {
        const messages = [];

        manager.addDelegate(new class {
            onPlayerText(player, message) {
                messages.push(message);
                return true;  // handled
            }
        });

        assert.isTrue(gunther.issueMessage('hello'));
        assert.isTrue(gunther.issueMessage('HELLO WORLD'));
        assert.isTrue(gunther.issueMessage('Hey George'));

        assert.equal(messages.length, 3);
        assert.equal(messages[0], 'hello');
        assert.equal(messages[1], 'Hello world.');
        assert.equal(messages[2], 'Hey Geroge');
    });

    it('should allow delegates to intercept received messages', assert => {
        let invocationCount = 0;

        manager.addDelegate(new class {
            onPlayerText(player, message) {
                invocationCount++;
                return true;  // handled
            }
        });

        manager.addDelegate(new class {
            onPlayerText(player, message) {
                invocationCount++;
                return false;  // not handled
            }
        });

        assert.isTrue(gunther.issueMessage('hello'));
        assert.equal(invocationCount, 1);
    });

    it('should be able to provide administrator chat', assert => {
        assert.isFalse(gunther.isAdministrator());
        assert.isFalse(russell.isAdministrator());

        // (1) Messages sent by a non-administrator, with no administrators in-game.
        assert.isTrue(gunther.issueMessage('@Hey'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.COMMUNICATION_ADMIN_SENT));

        assert.equal(russell.messages.length, 0);

        assert.equal(nuwani.messagesForTesting.length, 2);
        assert.deepEqual(nuwani.messagesForTesting[0], {
            tag: 'chat-admin',
            params: [ gunther.id, gunther.name, 'Hey' ],
        });

        assert.deepEqual(nuwani.messagesForTesting[1], {
            tag: 'chat-admin-offline',
            params: [ gunther.name, gunther.id, 'Hey' ],
        });

        // (2) Messages sent by an administrator, with an administrator in-game.
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(gunther.issueMessage('@Yo'));

        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1],
            Message.format(Message.COMMUNICATION_ADMIN_MESSAGE, 'Admin', gunther.name, gunther.id,
                           'Yo'));

        assert.equal(russell.messages.length, 0);

        assert.equal(nuwani.messagesForTesting.length, 3);
        assert.deepEqual(nuwani.messagesForTesting[2], {
            tag: 'chat-admin',
            params: [ gunther.id, gunther.name, 'Yo' ],
        });

        // (3) Messages sent by a Manager, with other administrators in-game.
        russell.level = Player.LEVEL_MANAGEMENT;

        assert.isTrue(russell.issueMessage('@Test'));

        assert.equal(gunther.messages.length, 3);
        assert.equal(
            gunther.messages[2],
            Message.format(Message.COMMUNICATION_ADMIN_MESSAGE, 'Manager', russell.name, russell.id,
                           'Test'));

        assert.equal(russell.messages.length, 1);
        assert.equal(
            russell.messages[0],
            Message.format(Message.COMMUNICATION_ADMIN_MESSAGE, 'Manager', russell.name, russell.id,
                           'Test'));

        assert.equal(nuwani.messagesForTesting.length, 4);
        assert.deepEqual(nuwani.messagesForTesting[3], {
            tag: 'chat-admin',
            params: [ russell.id, russell.name, 'Test' ],
        });

        // (4) Muted players can still send messages to admin chat.
        muteManager.mutePlayer(gunther, 60);

        assert.isTrue(gunther.issueMessage('Testcase'));
        assert.equal(gunther.messages.length, 4);
        assert.equal(russell.messages.length, 1);

        assert.isTrue(gunther.issueMessage('@Testcase'));
        assert.equal(gunther.messages.length, 5);
        assert.equal(russell.messages.length, 2);

        // (5) Messages sent by an isolated person.
        gunther.syncedData.setIsolated(true);

        assert.isTrue(gunther.issueMessage('@WTF!'));

        assert.equal(gunther.messages.length, 6);
        assert.equal(gunther.messages[5], Message.format(Message.COMMUNICATION_ADMIN_SENT));

        assert.equal(russell.messages.length, 2);  // unchanged
        assert.equal(nuwani.messagesForTesting.length, 5);  // unchanged
    });

    it('should have a series of specialization in the administrator chat', assert => {
        const channel = new AdministratorChannel();

        const Luce = { account: { userId: 31797 }};
        const TEF = { account: { userId: 29685 }};

        assert.equal(channel.getPrefixForPlayer(Luce), 'Lady');
        assert.equal(channel.getPrefixForPlayer(TEF), 'The');

        assert.equal(channel.getPrefixForPlayer(gunther), 'Message from');

        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.equal(channel.getPrefixForPlayer(gunther), 'Admin');

        gunther.level = Player.LEVEL_MANAGEMENT;

        assert.equal(channel.getPrefixForPlayer(gunther), 'Manager');
    });

    it('should be able to provide a private VIP chat', assert => {
        assert.isFalse(gunther.isVip());
        assert.isFalse(russell.isVip());

        assert.isTrue(gunther.issueMessage('#Hello!'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.COMMUNICATION_VIP_NO_ACCESS));

        assert.equal(russell.messages.length, 0);
        assert.equal(nuwani.messagesForTesting.length, 0);

        gunther.setVip(true);

        assert.isTrue(gunther.issueMessage('#Heya!'));

        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1],
            Message.format(Message.COMMUNICATION_VIP_MESSAGE, gunther.id, gunther.name, 'Heya!'));

        assert.equal(nuwani.messagesForTesting.length, 1);
        assert.deepEqual(nuwani.messagesForTesting[0], {
            tag: 'chat-vip',
            params: [ gunther.id, gunther.name, 'Heya!' ],
        });

        assert.equal(russell.messages.length, 0);

        russell.setVip(true);

        assert.isTrue(gunther.issueMessage('#Boo!'));

        assert.equal(gunther.messages.length, 3);
        assert.equal(
            gunther.messages[2],
            Message.format(Message.COMMUNICATION_VIP_MESSAGE, gunther.id, gunther.name, 'Boo!'));

        assert.equal(russell.messages.length, 1);
        assert.equal(
            russell.messages[0],
            Message.format(Message.COMMUNICATION_VIP_MESSAGE, gunther.id, gunther.name, 'Boo!'));

        assert.equal(nuwani.messagesForTesting.length, 2);

        russell.syncedData.setIsolated(true);

        assert.isTrue(russell.issueMessage('#Silence'));

        assert.equal(gunther.messages.length, 3); // no change
        assert.equal(russell.messages.length, 2);
        assert.equal(
            russell.messages[1],
            Message.format(Message.COMMUNICATION_VIP_MESSAGE, russell.id, russell.name, 'Silence'));
        
        assert.equal(nuwani.messagesForTesting.length, 2);
    });

    it('should provide the ability to have phone conversations', assert => {
        const lucy = server.playerManager.getById(/* Lucy= */ 2);

        const channel = manager.getCallChannel();
        assert.isNotNull(channel);

        assert.isUndefined(channel.getConversationPartner(gunther));
        assert.isUndefined(channel.getConversationPartner(russell));

        assert.isFalse(channel.confirmChannelAccessForPlayer(gunther));
        assert.isFalse(channel.confirmChannelAccessForPlayer(russell));

        channel.establish(gunther, russell);

        assert.equal(channel.getConversationPartner(gunther), russell);
        assert.equal(channel.getConversationPartner(russell), gunther);

        assert.isTrue(channel.confirmChannelAccessForPlayer(gunther));
        assert.isTrue(channel.confirmChannelAccessForPlayer(russell));

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.COMMUNICATION_CALL_CONNECTED, russell.name));

        assert.equal(russell.messages.length, 1);
        assert.equal(
            russell.messages[0],
            Message.format(Message.COMMUNICATION_CALL_CONNECTED, gunther.name));

        gunther.issueMessage('Hey, how are you?');

        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1],
            Message.format(Message.COMMUNICATION_CALL_MESSAGE, gunther.id, gunther.name,
                           'Hey, how are you?'));

        assert.equal(russell.messages.length, 2);
        assert.equal(russell.messages[1], gunther.messages[1]);

        assert.equal(lucy.messages.length, 0);

        russell.disconnectForTesting();

        assert.isUndefined(channel.getConversationPartner(gunther));
        assert.isFalse(channel.confirmChannelAccessForPlayer(gunther));

        assert.equal(gunther.messages.length, 3);
        assert.equal(
            gunther.messages[2],
            Message.format(Message.COMMUNICATION_CALL_DISCONNECTED_LEFT, russell.name));
        
        channel.establish(gunther, lucy);

        assert.equal(channel.getConversationPartner(gunther), lucy);
        assert.isTrue(channel.confirmChannelAccessForPlayer(gunther));
        assert.isTrue(channel.confirmChannelAccessForPlayer(lucy));

        channel.disconnect(lucy, gunther);

        assert.equal(gunther.messages.length, 5);
        assert.equal(
            gunther.messages[4],
            Message.format(Message.COMMUNICATION_CALL_DISCONNECTED, lucy.name, 'they'));

        assert.equal(lucy.messages.length, 2);
        assert.equal(
            lucy.messages[1],
            Message.format(Message.COMMUNICATION_CALL_DISCONNECTED, gunther.name, 'you'));
    });
});
