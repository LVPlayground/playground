// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('IgnoreCommands', (it, beforeEach) => {
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

    it('makes it possible to ignore and unignore other players', async (assert) => {
        // (1) Nobody is ignored by default.
        assert.equal(visibilityManager.getIgnoredPlayers(gunther).length, 0);
        assert.equal(visibilityManager.getIgnoredPlayers(russell).length, 0);

        assert.isTrue(await gunther.issueCommand('/ignored'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.IGNORE_IGNORED_NOBODY));

        // (2) Players can ignore each other.
        assert.isTrue(await gunther.issueCommand('/ignore Russell'));

        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1], Message.format(Message.IGNORE_ADDED_PLAYER, russell.name));

        assert.includes(visibilityManager.getIgnoredPlayers(gunther), russell);
        assert.equal(visibilityManager.getIgnoredPlayers(russell).length, 0);

        // (3) Players can't ignore each other multiple times.
        assert.isTrue(await gunther.issueCommand('/ignore Russell'));

        assert.equal(gunther.messages.length, 3);
        assert.equal(
            gunther.messages[2], Message.format(Message.IGNORE_ADDED_REDUNDANT, russell.name));

        // (4) Ignored players are reflected in the command.
        assert.isTrue(await gunther.issueCommand('/ignored'));

        assert.equal(gunther.messages.length, 4);
        assert.equal(
            gunther.messages[3], Message.format(Message.IGNORE_IGNORED, 'Russell (Id:1)'));

        // (5) Players can unignore each other.
        assert.isTrue(await gunther.issueCommand('/unignore Russell'));

        assert.equal(gunther.messages.length, 5);
        assert.equal(
            gunther.messages[4], Message.format(Message.IGNORE_REMOVED_PLAYER, russell.name));

        assert.equal(visibilityManager.getIgnoredPlayers(gunther).length, 0);
        assert.equal(visibilityManager.getIgnoredPlayers(russell).length, 0);

        // (6) Players can't unignore people they're not ignoring.
        assert.isTrue(await gunther.issueCommand('/unignore Russell'));

        assert.equal(gunther.messages.length, 6);
        assert.equal(
            gunther.messages[5], Message.format(Message.IGNORE_REMOVED_REDUNDANT, russell.name));
    });
});
