// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('ColorCommand', (it, beforeEach) => {
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

    it('should enable players to change their colors', async (assert) => {
        // (1) Non-VIP players get an error message when changing their colour.
        assert.isTrue(await gunther.issueCommand('/my color'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.PLAYER_COMMANDS_REQUIRES_VIP);

        assert.isTrue(await russell.issueCommand('/p Russell color'));

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], Message.PLAYER_COMMANDS_REQUIRES_VIP);

        gunther.setVip(true);
        russell.setVip(true);

        // (2) It's possible for players to change their own colour.
        {
            const currentColor = russell.color;

            assert.isTrue(await russell.issueCommand('/my color'));
            assert.notDeepEqual(russell.color, currentColor);

            assert.equal(russell.messages.length, 2);
            assert.equal(russell.messages[1], Message.PLAYER_COMMANDS_COLOR_UPDATED_SELF);
        }

        // (3) It's possible for administrators to change other player's colours.
        {
            const currentColor = gunther.color;

            assert.isTrue(await russell.issueCommand('/p gunth color'));
            assert.notDeepEqual(gunther.color, currentColor);

            assert.equal(russell.messages.length, 4);
            assert.includes(
                russell.messages[2],
                Message.format(Message.PLAYER_COMMANDS_COLOR_UPDATED_FYI_ADMIN, russell.name,
                               russell.id, gunther.name, gunther.id, 'FFFF00'));

            assert.equal(
                russell.messages[3],
                Message.format(Message.PLAYER_COMMANDS_COLOR_UPDATED_OTHER, gunther.name,
                               gunther.id));
            
            assert.equal(gunther.messages.length, 2);
            assert.equal(
                gunther.messages[1],
                Message.format(Message.PLAYER_COMMANDS_COLOR_UPDATED_FYI, russell.name,
                               russell.id));
        }

        // (4) A warning message is shown when trying to update to an invalid color.
        assert.isTrue(await russell.issueCommand('/my color bananarama'));

        assert.equal(russell.messages.length, 5);
        assert.equal(russell.messages[4], Message.PLAYER_COMMANDS_COLOR_INVALID_FORMAT);

        // (5) Administrators can update colours to specific RGB values.
        {
            const color = 'FFFF00';

            assert.isTrue(await russell.issueCommand('/my color #' + color));
            assert.equal(russell.color.toHexRGB(), color);
        }
    });
});
