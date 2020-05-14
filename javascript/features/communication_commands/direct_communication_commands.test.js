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

    it('should be able to send secret private messages', async (assert) => {
        const playground = server.featureManager.loadFeature('playground');

        // Grant everyone access to the /spm command to enable this test.
        playground.access.setCommandLevel('spm', Player.LEVEL_PLAYER);

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
});
