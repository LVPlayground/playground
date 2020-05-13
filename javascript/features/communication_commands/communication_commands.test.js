// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { kCallExpirationTimeSec } from 'features/communication_commands/communication_commands.js';

describe('CommunicationCommands', (it, beforeEach) => {
    let gunther = null;
    let russell = null;

    let callChannel = null;
    let muteManager = null;

    beforeEach(async() => {
        server.featureManager.loadFeature('communication_commands');

        const communication = server.featureManager.loadFeature('communication');

        callChannel = communication.manager_.getCallChannel();
        muteManager = communication.muteManager_;

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        russell.level = Player.LEVEL_ADMINISTRATOR;

        await russell.identify();
    });

    it('should enable people to call each other', async (assert) => {
        assert.isUndefined(callChannel.getConversationPartner(gunther));
        assert.isUndefined(callChannel.getConversationPartner(russell));

        const lucy = server.playerManager.getById(/* Lucy= */ 2);

        // (1) It should allow players to call each other, and have it expire.
        assert.isTrue(await russell.issueCommand('/call Gunther'));
        assert.equal(russell.messages.length, 1);
        assert.equal(
            russell.messages[0], Message.format(Message.COMMUNICATION_DIAL_WAITING, gunther.name));

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0], Message.format(Message.COMMUNICATION_DIAL_REQUEST, russell.name));

        await server.clock.advance(kCallExpirationTimeSec * 1000);

        assert.equal(russell.messages.length, 2);
        assert.equal(
            russell.messages[1], Message.format(Message.COMMUNICATION_DIAL_EXPIRED, gunther.name));

        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1],
            Message.format(Message.COMMUNICATION_DIAL_EXPIRED_RECIPIENT, russell.name));

        // (2) It should only allow one call to be active at a time.
        assert.isTrue(await russell.issueCommand('/call Gunther'));
        assert.equal(russell.messages.length, 3);

        assert.isTrue(await russell.issueCommand('/call Lucy'));
        assert.equal(russell.messages.length, 4);
        assert.equal(
            russell.messages[3],
            Message.format(Message.COMMUNICATION_DIAL_BUSY_SELF, gunther.name));

        await server.clock.advance(kCallExpirationTimeSec * 1000);

        assert.equal(russell.messages.length, 5);
        assert.equal(gunther.messages.length, 4);
        assert.equal(lucy.messages.length, 0);

        // (3) It should allow players to call each other, and have it rejected.
        assert.isTrue(await russell.issueCommand('/call Gunther'));
        assert.equal(russell.messages.length, 6);

        assert.isTrue(await gunther.issueCommand('/reject'));
        assert.equal(gunther.messages.length, 6);
        assert.equal(
            gunther.messages[5], Message.format(Message.COMMUNICATION_DIAL_REJECTED, russell.name));

        assert.equal(russell.messages.length, 7);
        assert.equal(
            russell.messages[6],
            Message.format(Message.COMMUNICATION_DIAL_REJECTED_RECIPIENT, gunther.name));

        assert.isTrue(await gunther.issueCommand('/answer'));
        assert.equal(gunther.messages.length, 7);
        assert.equal(
            gunther.messages[6], Message.format(Message.COMMUNICATION_DIAL_ANSWER_UNKNOWN));

        // (4) It should allow players to establish a conversation.
        assert.isTrue(await russell.issueCommand('/call Gunther'));
        assert.equal(russell.messages.length, 8);

        assert.isTrue(await gunther.issueCommand('/answer'));
        assert.equal(gunther.messages.length, 9);
        assert.equal(
            gunther.messages[8],
            Message.format(Message.COMMUNICATION_CALL_CONNECTED, russell.name));

        assert.equal(russell.messages.length, 9);
        assert.equal(
            russell.messages[8],
            Message.format(Message.COMMUNICATION_CALL_CONNECTED, gunther.name));

        assert.equal(callChannel.getConversationPartner(gunther), russell);
        assert.equal(callChannel.getConversationPartner(russell), gunther);

        // (5) It should not be possible to call players who already are in a conversation.
        assert.isTrue(await lucy.issueCommand('/call Gunther'));
        assert.equal(lucy.messages.length, 1);
        assert.equal(
            lucy.messages[0],
            Message.format(Message.COMMUNICATION_DIAL_BUSY_RECIPIENT, gunther.name));

        // (6) It should allow players to hang up an ongoing conversation.
        assert.isTrue(await gunther.issueCommand('/hangup'));
        assert.equal(gunther.messages.length, 10);
        assert.equal(
            gunther.messages[9],
            Message.format(Message.COMMUNICATION_CALL_DISCONNECTED, russell.name, 'you'));

        assert.equal(russell.messages.length, 10);
        assert.equal(
            russell.messages[9],
            Message.format(Message.COMMUNICATION_CALL_DISCONNECTED, gunther.name, 'they'));

        assert.isUndefined(callChannel.getConversationPartner(gunther));
        assert.isUndefined(callChannel.getConversationPartner(russell));

        // (7) It should not be possible to hang up the phone when not in a conversation.
        assert.isTrue(await gunther.issueCommand('/hangup'));
        assert.equal(gunther.messages.length, 11);
        assert.equal(
            gunther.messages[10], Message.format(Message.COMMUNICATION_DIAL_HANGUP_UNKNOWN));
    });

    it('makes it possible to mute and unmute other players', async (assert) => {
        assert.isNull(muteManager.getPlayerRemainingMuteTime(gunther));

        assert.isTrue(await russell.issueCommand('/muted'));

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], Message.format(Message.MUTE_MUTED_NOBODY));

        assert.isTrue(await russell.issueCommand('/unmute Gunther'));

        assert.equal(russell.messages.length, 2);
        assert.equal(
            russell.messages[1],
            Message.format(Message.MUTE_UNMUTE_NOT_MUTED, gunther.name, gunther.id));

        assert.isTrue(await russell.issueCommand('/mute Gunther'));
        assert.closeTo(muteManager.getPlayerRemainingMuteTime(gunther), 180, 5);

        assert.equal(russell.messages.length, 4);
        assert.includes(
            russell.messages[2],
            Message.format(Message.MUTE_ADMIN_MUTED, russell.name, russell.id, gunther.name,
                           gunther.id, '3 minutes'));

        assert.equal(
            russell.messages[3],
            Message.format(Message.MUTE_MUTED, gunther.name, gunther.id, '3 minutes'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.MUTE_MUTED_TARGET, russell.name, russell.id, '3 minutes'));

        assert.isTrue(await russell.issueCommand('/muted'));

        assert.equal(russell.messages.length, 5);
        assert.equal(
            russell.messages[4],
            Message.format(Message.MUTE_MUTED_LIST, gunther.name, gunther.id, '3 minutes'));

        assert.isTrue(await russell.issueCommand('/mute Gunther 5'));
        assert.closeTo(muteManager.getPlayerRemainingMuteTime(gunther), 300, 5);

        assert.equal(russell.messages.length, 7);
        assert.includes(
            russell.messages[5],
            Message.format(Message.MUTE_ADMIN_MUTED, russell.name, russell.id, gunther.name,
                gunther.id, '5 minutes'));

        assert.equal(
            russell.messages[6],
            Message.format(Message.MUTE_MUTED, gunther.name, gunther.id, '5 minutes'));

        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1],
            Message.format(Message.MUTE_MUTED_TARGET_UPDATE, russell.name, russell.id, 'extended',
            '5 minutes'));

        assert.isTrue(await russell.issueCommand('/unmute Gunther'));

        assert.equal(russell.messages.length, 9);
        assert.includes(
            russell.messages[7],
            Message.format(Message.MUTE_ADMIN_UNMUTED, russell.name, russell.id, gunther.name,
                           gunther.id));

        assert.equal(
            russell.messages[8], Message.format(Message.MUTE_UNMUTED, gunther.name, gunther.id));

        assert.equal(gunther.messages.length, 3);
        assert.equal(
            gunther.messages[2],
            Message.format(Message.MUTE_UNMUTED_TARGET, russell.name, russell.id));

        assert.isNull(muteManager.getPlayerRemainingMuteTime(gunther));
    });

    it('should be able to show people how to report others', async (assert) => {
        assert.isNull(muteManager.getPlayerRemainingMuteTime(gunther));

        assert.isTrue(await russell.issueCommand('/showreport Gunther'));
        assert.isAbove(muteManager.getPlayerRemainingMuteTime(gunther), 0);

        assert.equal(russell.messages.length, 2);
        assert.includes(
            russell.messages[0],
            Message.format(Message.MUTE_ADMIN_MUTED, russell.name, russell.id, gunther.name,
                gunther.id, '2 minutes'));
            
        assert.equal(
            russell.messages[1],
            Message.format(Message.MUTE_MUTED, gunther.name, gunther.id, '2 minutes'));
        
        assert.equal(gunther.messages.length, 4);
        assert.equal(gunther.messages[0], Message.MUTE_SHOW_REPORT_BORDER);
        assert.equal(
            gunther.messages[1],
            Message.format(Message.MUTE_SHOW_REPORT_MESSAGE_1, russell.name, russell.id, 
                           '2 minutes'));

        assert.equal(gunther.messages[2], Message.MUTE_SHOW_REPORT_MESSAGE_2);
        assert.equal(gunther.messages[3], Message.MUTE_SHOW_REPORT_BORDER);

        assert.isTrue(await russell.issueCommand('/showreport Gunther'));

        assert.equal(russell.messages.length, 3);
        assert.equal(
            russell.messages[2],
            Message.format(Message.MUTE_SHOW_REPORT_ALREADY_MUTED, gunther.name, gunther.id));
    });
});
