// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const PlaygroundCommands = require('features/playground/playground_commands.js');
const PlaygroundManager = require('features/playground/playground_manager.js');
const MockAnnounce = require('features/announce/test/mock_announce.js');

describe('PlaygroundCommands', (it, beforeEach, afterEach) => {
    let commands = null;
    let gunther = null;
    let manager = null;

    beforeEach(() => {
        const announce = new MockAnnounce();

        manager = new PlaygroundManager();
        commands = new PlaygroundCommands(manager, () => announce);

        gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify();
    });

    afterEach(() => {
        if (commands)
            commands.dispose();

        manager.dispose();
    });

    it('should not leave any stray commands on the server', assert => {
        assert.isAbove(server.commandManager.size, 0);

        commands.dispose();
        commands = null;

        assert.equal(server.commandManager.size, 0);
    });

    it('should send a different usage message to administrators and management', async(assert) => {
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(await gunther.issueCommand('/lvp'));
        assert.equal(gunther.messages.length, 2);

        gunther.level = Player.LEVEL_MANAGEMENT;

        assert.isTrue(await gunther.issueCommand('/lvp'));
        assert.equal(gunther.messages.length, 4);

        assert.notEqual(gunther.messages[1], gunther.messages[3]);
    });

    const options = ['party'];

    options.forEach(option => {
        it('should enable crew to change the "' + option + '" option', async(assert) => {
            gunther.level = Player.LEVEL_MANAGEMENT;

            // Disable the option by default to start in a consistent state.
            manager.setOptionEnabled(option, false);

            // (1) Reading the option's status should reflect that it's disabled.
            assert.isTrue(await gunther.issueCommand('/lvp ' + option));
            assert.equal(gunther.messages.length, 1);
            assert.equal(gunther.messages[0], Message.format(Message.LVP_PLAYGROUND_OPTION_STATUS,
                                                             option, 'disabled', option));

            gunther.clearMessages();

            // (2) Trying to disable the option again should yield a specialized message.
            assert.isTrue(await gunther.issueCommand('/lvp ' + option + ' off'));
            assert.equal(gunther.messages.length, 1);
            assert.equal(gunther.messages[0],
                         Message.format(Message.LVP_PLAYGROUND_OPTION_NO_CHANGE,
                                        option, 'disabled'));

            gunther.clearMessages();

            // (3) Enabling the option should reflect in the status being updated.
            assert.isTrue(await gunther.issueCommand('/lvp ' + option + ' on'));
            assert.equal(gunther.messages.length, 2);
            assert.isTrue(
                gunther.messages[1].includes(Message.format(Message.LVP_ANNOUNCE_ADMIN_NOTICE,
                                                            gunther.name, gunther.id, 'enabled',
                                                            option)));

            assert.isTrue(manager.isOptionEnabled(option));

            gunther.clearMessages();

            // (4) Disabling the option again should reflect in the status being updated.
            assert.isTrue(await gunther.issueCommand('/lvp ' + option + ' off'));
            assert.equal(gunther.messages.length, 2);
            assert.isTrue(
                gunther.messages[1].includes(Message.format(Message.LVP_ANNOUNCE_ADMIN_NOTICE,
                                                            gunther.name, gunther.id, 'disabled',
                                                            option)));

            assert.isFalse(manager.isOptionEnabled(option));
        });
    });
});
