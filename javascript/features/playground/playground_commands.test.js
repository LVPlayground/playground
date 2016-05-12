// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const PlaygroundCommands = require('features/playground/playground_commands.js');
const PlaygroundManager = require('features/playground/playground_manager.js');
const MockAnnounce = require('features/announce/test/mock_announce.js');
const MockServer = require('test/mock_server.js');

describe('PlaygroundCommands', (it, beforeEach, afterEach) => {
    let playgroundCommands = null;
    let playgroundManager = null;
    let player = null;

    MockServer.bindTo(beforeEach, afterEach,
        () => {
            playgroundManager = new PlaygroundManager();
            playgroundCommands = new PlaygroundCommands(playgroundManager, new MockAnnounce());
            player = server.playerManager.getById(0 /* Gunther */);

        }, () => {
            playgroundCommands.dispose();
            playgroundManager.dispose();
        });

    it('should maintain the options in a sorted list', assert => {
        const sorted = playgroundManager.options.sort();
        const options = playgroundManager.options;

        assert.deepEqual(sorted, options);
    });

    it('should display an information dialog when using /lvp10', assert => {
        assert.isTrue(player.issueCommand('/lvp10'));
        assert.equal(player.messages.length, 0);

        assert.isNotNull(player.lastDialog);
    });

    it('should display an information dialog when a player tries to use /lvp10 set', assert => {
        assert.isTrue(player.issueCommand('/lvp10 set'));
        assert.equal(player.messages.length, 0);

        assert.isNotNull(player.lastDialog);
    });

    it('should enable administrators to get a list of options using /lvp10 set', assert => {
        player.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(player.issueCommand('/lvp10 set'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.format(Message.LVP_ANNIVERSARY_OPTIONS,
                                                        playgroundManager.options.join('/')));

        player.clearMessages();

        assert.isTrue(player.issueCommand('/lvp10 set bogusfeature'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.format(Message.LVP_ANNIVERSARY_OPTIONS,
                                                        playgroundManager.options.join('/')));
    });

    it('should enable administrators to get the status of an option using /lvp10 set', assert => {
        player.level = Player.LEVEL_ADMINISTRATOR;

        playgroundManager.setOptionEnabled('jetpack', true);

        assert.isTrue(player.issueCommand('/lvp10 set jetpack'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.format(Message.LVP_ANNIVERSARY_OPTION_STATUS,
                                                        'jetpack', 'enabled', 'jetpack'));
    });

    it('should dislay an acknowledgement when not changing the value of an option', assert => {
        player.level = Player.LEVEL_ADMINISTRATOR;

        playgroundManager.setOptionEnabled('jetpack', true);

        assert.isTrue(player.issueCommand('/lvp10 set jetpack on'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.format(Message.LVP_ANNIVERSARY_OPTION_NO_CHANGE,
                                                        'jetpack', 'enabled'));
    });

    it('should enable administrators to toggle options using /lvp10 set [option]', assert => {
        const russell = server.playerManager.getById(1 /* Russell */);

        player.level = Player.LEVEL_ADMINISTRATOR;

        playgroundManager.setOptionEnabled('jetpack', false);
        assert.isFalse(playgroundManager.isOptionEnabled('jetpack'));

        assert.isTrue(player.issueCommand('/lvp10 set jetpack on'));
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

        assert.isTrue(player.issueCommand('/lvp10 set jetpack off'));
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

    it('should disable jetpacks for players when the option is disabled', assert => {
        assert.isTrue(player.issueCommand('/jetpack'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.LVP_JETPACK_NOT_AVAILABLE);
        assert.equal(player.specialAction, Player.SPECIAL_ACTION_NONE);
    });

    it('should enable jetpacks for players when the option is enabled', assert => {
        playgroundManager.setOptionEnabled('jetpack', true);

        assert.isTrue(player.issueCommand('/jetpack'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.LVP_JETPACK_GRANTED_SELF);
        assert.equal(player.specialAction, Player.SPECIAL_ACTION_USEJETPACK);
    });

    it('should enable administrators to get a jetpack for themselves regardless', assert => {
        playgroundManager.setOptionEnabled('jetpack', false);

        player.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(player.issueCommand('/jetpack'));
        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.LVP_JETPACK_GRANTED_SELF);
        assert.equal(player.specialAction, Player.SPECIAL_ACTION_USEJETPACK);
    });

    it('should enable administrators to give a jetpack to another player', assert => {
        const russell = server.playerManager.getById(1 /* Russell */);

        player.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(player.issueCommand('/jetpack ' + russell.name));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.format(Message.LVP_JETPACK_GRANTED_OTHER,
                                                        russell.name, russell.id));

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], Message.format(Message.LVP_JETPACK_GRANTED, player.name,
                                                         player.id));

        assert.equal(russell.specialAction, Player.SPECIAL_ACTION_USEJETPACK);
    });

    it('should enable administrators to remove administrators from players', assert => {
        const russell = server.playerManager.getById(1 /* Russell */);
        russell.specialAction = Player.SPECIAL_ACTION_USEJETPACK;

        player.level = Player.LEVEL_ADMINISTRATOR;
        
        assert.isTrue(player.issueCommand('/jetpack ' + russell.name + ' remove'));

        assert.equal(player.messages.length, 1);
        assert.equal(player.messages[0], Message.format(Message.LVP_JETPACK_REMOVED_OTHER,
                                                        russell.name, russell.id));

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], Message.format(Message.LVP_JETPACK_REMOVED, player.name,
                                                         player.id));

        assert.equal(russell.specialAction, Player.SPECIAL_ACTION_NONE);
    });
});
