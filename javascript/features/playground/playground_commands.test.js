// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const PlaygroundCommands = require('features/playground/playground_commands.js');
const PlaygroundManager = require('features/playground/playground_manager.js');
const MockAnnounce = require('features/announce/test/mock_announce.js');

describe('PlaygroundCommands', (it, beforeEach, afterEach) => {
    let playgroundCommands = null;
    let playgroundManager = null;
    let player = null;

    beforeEach(() => {
        playgroundManager = new PlaygroundManager();
        playgroundCommands = new PlaygroundCommands(playgroundManager, new MockAnnounce());
        player = server.playerManager.getById(0 /* Gunther */);
    });

    afterEach(() => {
        playgroundCommands.dispose();
        playgroundManager.dispose();
    });

return; // TODO: Fix this up

    it('should maintain the options in a sorted list', assert => {
        const sorted = playgroundManager.options.sort();
        const options = playgroundManager.options;

        assert.deepEqual(sorted, options);
    });

    it('should display an error message when a player tries to use /lvp', assert => {
        assert.isTrue(player.issueCommand('/lvp'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.format(Message.COMMAND_ERROR_INSUFFICIENT_RIGHTS,
                                                        playerLevelToString(Player.LEVEL_ADMINISTRATOR,
                                                        true /* plural */)));
    });

    it('should enable administrators to get a list of options using /lvp set', assert => {
        player.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(player.issueCommand('/lvp set'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.format(Message.LVP_PLAYGROUND_OPTIONS,
                                                        playgroundManager.options.join('/')));

        player.clearMessages();

        assert.isTrue(player.issueCommand('/lvp set bogusfeature'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.format(Message.LVP_PLAYGROUND_OPTIONS,
                                                        playgroundManager.options.join('/')));
    });

    it('should enable administrators to get the status of an option using /lvp set', assert => {
        player.level = Player.LEVEL_ADMINISTRATOR;

        playgroundManager.setOptionEnabled('jetpack', true);

        assert.isTrue(player.issueCommand('/lvp set jetpack'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.format(Message.LVP_PLAYGROUND_OPTION_STATUS,
                                                        'jetpack', 'enabled', 'jetpack'));
    });

    it('should dislay an acknowledgement when not changing the value of an option', assert => {
        player.level = Player.LEVEL_ADMINISTRATOR;

        playgroundManager.setOptionEnabled('jetpack', true);

        assert.isTrue(player.issueCommand('/lvp set jetpack on'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.format(Message.LVP_PLAYGROUND_OPTION_NO_CHANGE,
                                                        'jetpack', 'enabled'));
    });

    it('should enable administrators to toggle options using /lvp set [option]', assert => {
        const russell = server.playerManager.getById(1 /* Russell */);

        player.level = Player.LEVEL_ADMINISTRATOR;

        playgroundManager.setOptionEnabled('jetpack', false);
        assert.isFalse(playgroundManager.isOptionEnabled('jetpack'));

        assert.isTrue(player.issueCommand('/lvp set jetpack on'));
        assert.isTrue(playgroundManager.isOptionEnabled('jetpack'));

        assert.equal(russell.messages.length, 1);
        assert.isTrue(
            russell.messages[0].includes(Message.format(Message.LVP_ANNOUNCE_JETPACK, player.name,
                                                        'enabled')));

        assert.equal(player.messages.length, 2);
        assert.equal(player.messages[0], russell.messages[0]);
        assert.isTrue(
            player.messages[1].includes(Message.format(Message.LVP_ANNOUNCE_ADMIN_NOTICE,
                                                       player.name, player.id, 'enabled',
                                                       'jetpack')));

        player.clearMessages();
        russell.clearMessages();

        assert.isTrue(player.issueCommand('/lvp set jetpack off'));
        assert.isFalse(playgroundManager.isOptionEnabled('jetpack'));

        assert.equal(russell.messages.length, 1);
        assert.isTrue(
            russell.messages[0].includes(Message.format(Message.LVP_ANNOUNCE_JETPACK, player.name,
                                                        'disabled')));

        assert.equal(player.messages.length, 2);
        assert.equal(player.messages[0], russell.messages[0]);
        assert.isTrue(
            player.messages[1].includes(Message.format(Message.LVP_ANNOUNCE_ADMIN_NOTICE,
                                                       player.name, player.id, 'disabled',
                                                       'jetpack')));
    });
});
