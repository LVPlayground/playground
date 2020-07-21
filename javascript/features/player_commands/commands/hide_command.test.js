// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('HideCommand', (it, beforeEach) => {
    let gunther = null;
    let russell = null;

    beforeEach(async () => {
        const feature = server.featureManager.loadFeature('player_commands');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        russell.level = Player.LEVEL_ADMINISTRATOR;

        await feature.registry_.initialize();
        await russell.identify();
    });

    it('should enable players to change their visibility', async (assert) => {
        // (1) Regular players don't have access to this command.
        assert.isTrue(await gunther.issueCommand('/my hide on'));

        assert.isTrue(gunther.colors.visible);
        assert.equal(gunther.messages.length, 0);

        // (2) Administrators can change their own visibility.
        assert.isTrue(await russell.issueCommand('/my hide on'));

        assert.isFalse(russell.colors.visible);
        assert.equal(russell.messages.length, 2);
        assert.includes(
            russell.messages[0],
            Message.format(Message.PLAYER_COMMANDS_UPDATED_SELF_ADMIN, russell.name, russell.id,
                           'hidden'));

        assert.equal(
            russell.messages[1], Message.format(Message.PLAYER_COMMANDS_UPDATED_SELF, 'hidden'));

        // (3) Administrators can change visibility of other players.
        assert.isTrue(await russell.issueCommand('/p gunt hide on'));

        assert.isFalse(gunther.colors.visible);
        assert.equal(russell.messages.length, 4);
        assert.includes(
            russell.messages[2],
            Message.format(Message.PLAYER_COMMANDS_UPDATED_OTHER_ADMIN, russell.name, russell.id,
                           gunther.name, gunther.id, 'hidden'));

        assert.equal(
            russell.messages[3],
            Message.format(Message.PLAYER_COMMANDS_UPDATED_OTHER, gunther.name, gunther.id,
                           'hidden'));
    
        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.PLAYER_COMMANDS_UPDATED_FYI, russell.name, russell.id,
                           'hidden'));

        // (4) It can display the current status of player visibility.
        assert.isTrue(await russell.issueCommand('/p gunt hide'));

        assert.equal(russell.messages.length, 5);
        assert.equal(
            russell.messages[4],
            Message.format(Message.PLAYER_COMMANDS_HIDE_STATUS_OTHER, 'hidden'));

        // (5) It displays an error when updating visibility to its current state.
        assert.isTrue(await russell.issueCommand('/my hide on'));

        assert.equal(russell.messages.length, 6);
        assert.equal(
            russell.messages[5],
            Message.format(Message.PLAYER_COMMANDS_HIDE_NO_CHANGE_SELF, 'hidden'));
    });
});
