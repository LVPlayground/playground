// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const PlaygroundAccessTracker = require('features/playground/playground_access_tracker.js');
const PlaygroundCommands = require('features/playground/playground_commands.js');
const PlaygroundManager = require('features/playground/playground_manager.js');
const MockAnnounce = require('features/announce/test/mock_announce.js');

describe('PlaygroundCommands', (it, beforeEach, afterEach) => {
    let access = null;
    let commands = null;
    let gunther = null;
    let manager = null;

    beforeEach(() => {
        const announce = new MockAnnounce();
        const settings = server.featureManager.loadFeature('settings');

        access = new PlaygroundAccessTracker();
        manager = new PlaygroundManager();
        commands = new PlaygroundCommands(manager, access, () => announce, () => settings);

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

    it('should be able to deal with remote commands', async(assert) => {
        const COMMAND_NAME = 'aaaaaaa';

        const russell = server.playerManager.getById(1 /* Russell */);
        russell.identify();

        gunther.level = Player.LEVEL_MANAGEMENT;

        // We're going to assume that this command comes first in the list.
        access.registerCommand(COMMAND_NAME, Player.LEVEL_ADMINISTRATOR);

        assert.isFalse(access.canAccessCommand(COMMAND_NAME, russell));
        assert.equal(access.getCommandLevel(COMMAND_NAME), Player.LEVEL_ADMINISTRATOR);
        assert.equal(access.getDefaultCommandLevel(COMMAND_NAME), Player.LEVEL_ADMINISTRATOR);

        // Lower the level requirement of the |COMMAND_NAME| to all Players.
        gunther.respondToDialog({ listitem: 0 /* Assumed COMMAND_NAME */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Change required level */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* Player.LEVEL_PLAYER */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Yeah I get it */ }));

        assert.isTrue(await gunther.issueCommand('/lvp access'));

        assert.isTrue(access.canAccessCommand(COMMAND_NAME, russell));
        assert.isFalse(access.hasException(COMMAND_NAME, russell));
        assert.equal(access.getCommandLevel(COMMAND_NAME), Player.LEVEL_PLAYER);
        assert.equal(access.getDefaultCommandLevel(COMMAND_NAME), Player.LEVEL_ADMINISTRATOR);

        // Revoke the access level of the |COMMAND_NAME| back to administrators.
        access.setCommandLevel(COMMAND_NAME, Player.LEVEL_ADMINISTRATOR);

        assert.isFalse(access.canAccessCommand(COMMAND_NAME, russell));
        assert.equal(access.getCommandLevel(COMMAND_NAME), Player.LEVEL_ADMINISTRATOR);
        assert.equal(access.getDefaultCommandLevel(COMMAND_NAME), Player.LEVEL_ADMINISTRATOR);

        // Now grant an exception for Russell allowing him to use the command.
        gunther.respondToDialog({ listitem: 0 /* Assumed COMMAND_NAME */ }).then(
            () => gunther.respondToDialog({ listitem: 1 /* Grant exception */ })).then(
            () => gunther.respondToDialog({ response: 1, inputtext: russell.name })).then(
            () => gunther.respondToDialog({ response: 1 /* Yeah I get it */ }));

        assert.isTrue(await gunther.issueCommand('/lvp access'));

        assert.isTrue(access.canAccessCommand(COMMAND_NAME, russell));
        assert.isTrue(access.hasException(COMMAND_NAME, russell));
        assert.equal(access.getCommandLevel(COMMAND_NAME), Player.LEVEL_ADMINISTRATOR);
        assert.equal(access.getDefaultCommandLevel(COMMAND_NAME), Player.LEVEL_ADMINISTRATOR);
    });

    it('should be able to change boolean settings', async(assert) => {
        const settings = server.featureManager.loadFeature('settings');

        const russell = server.playerManager.getById(1 /* Russell */);
        russell.identify();

        gunther.level = Player.LEVEL_MANAGEMENT;

        // Disable the `spawn_vehicle_admin_override` section in the `abuse` section.
        gunther.respondToDialog({ listitem: 0 /* Assumed `abuse` */ }).then(
            () => gunther.respondToDialog({ listitem: 3 /* Assumed to be the override */ })).then(
            () => gunther.respondToDialog({ listitem: 1 /* Disable */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Yeah I get it */ }));

        assert.isTrue(settings.getValue('abuse/spawn_vehicle_admin_override'));
        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.isFalse(settings.getValue('abuse/spawn_vehicle_admin_override'));

        assert.equal(gunther.messages.length, 1);
        assert.isTrue(gunther.messages[0].includes('spawn_vehicle_admin_override'));
        assert.isTrue(gunther.messages[0].includes('disabled'));

        gunther.clearMessages();

        // Enable the `spawn_vehicle_admin_override` section in the `abuse` section.
        gunther.respondToDialog({ listitem: 0 /* Assumed `abuse` */ }).then(
            () => gunther.respondToDialog({ listitem: 3 /* Assumed to be the override */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* Disable */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Yeah I get it */ }));

        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.isTrue(settings.getValue('abuse/spawn_vehicle_admin_override'));

        assert.equal(gunther.messages.length, 1);
        assert.isTrue(gunther.messages[0].includes('spawn_vehicle_admin_override'));
        assert.isTrue(gunther.messages[0].includes('enabled'));
    });

    it('should be able to change numeric settings', async(assert) => {
        const settings = server.featureManager.loadFeature('settings');

        const russell = server.playerManager.getById(1 /* Russell */);
        russell.identify();

        gunther.level = Player.LEVEL_MANAGEMENT;

        // Disable the `spawn_vehicle_admin_override` section in the `abuse` section.
        gunther.respondToDialog({ listitem: 0 /* Assumed `abuse` */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Assumed to be the damage time */ })).then(
            () => gunther.respondToDialog({ response: 1, inputtext: '2000' })).then(
            () => gunther.respondToDialog({ response: 1 /* Yeah I get it */ }));

        assert.equal(settings.getValue('abuse/blocker_damage_issued_time'), 10);
        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.equal(settings.getValue('abuse/blocker_damage_issued_time'), 2000);

        assert.equal(gunther.messages.length, 1);
        assert.isTrue(gunther.messages[0].includes('blocker_damage_issued_time'));
        assert.isTrue(gunther.messages[0].includes('2,000'));

        gunther.clearMessages();

        // Enable the `spawn_vehicle_admin_override` section in the `abuse` section.
        gunther.respondToDialog({ listitem: 0 /* Assumed `abuse` */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Assumed to be the damage time */ })).then(
            () => gunther.respondToDialog({ response: 1, inputtext: '10' })).then(
            () => gunther.respondToDialog({ response: 1 /* Yeah I get it */ }));

        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.equal(settings.getValue('abuse/blocker_damage_issued_time'), 10);

        assert.equal(gunther.messages.length, 1);
        assert.isTrue(gunther.messages[0].includes('blocker_damage_issued_time'));
        assert.isTrue(gunther.messages[0].includes('10'));
    });
});
