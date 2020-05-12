// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import PlaygroundAccessTracker from 'features/playground/playground_access_tracker.js';
import PlaygroundCommands from 'features/playground/playground_commands.js';
import Setting from 'entities/setting.js';

describe('PlaygroundCommands', (it, beforeEach, afterEach) => {
    let access = null;
    let commands = null;
    let communication = null;
    let gunther = null;

    beforeEach(async() => {
        const announce = server.featureManager.loadFeature('announce');
        const nuwani = server.featureManager.loadFeature('nuwani');
        const settings = server.featureManager.loadFeature('settings');

        communication = server.featureManager.loadFeature('communication');

        access = new PlaygroundAccessTracker();
        commands = new PlaygroundCommands(
            access, () => announce, () => communication, () => nuwani, () => settings);

        gunther = server.playerManager.getById(0 /* Gunther */);
        await gunther.identify();
    });

    afterEach(() => {
        if (commands)
            commands.dispose();
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

    it('should be able to deal with remote commands', async(assert) => {
        const COMMAND_NAME = 'aaaaaaa';

        const russell = server.playerManager.getById(1 /* Russell */);
        await russell.identify();

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

    it('should be able to capture profiles with a given duration', async(assert) => {
        gunther.level = Player.LEVEL_MANAGEMENT;

        let captureMilliseconds = null;
        let captureFilename = null;

        commands.captureProfileFn_ = (milliseconds, filename) => {
            captureMilliseconds = milliseconds;
            captureFilename = filename;
        };

        // (1) It should validate the valid range of the profile duration.
        {
            assert.isTrue(await gunther.issueCommand('/lvp profile 42'));
            assert.isTrue(await gunther.issueCommand('/lvp profile 240000'));

            const expected = Message.format(Message.LVP_PROFILE_INVALID_RANGE, 100, 180000);

            assert.equal(gunther.messages.length, 2);
            assert.equal(gunther.messages[0], expected);
            assert.equal(gunther.messages[1], expected);

            gunther.clearMessages();
        }

        let filename = null;

        // (2) It should be able to start a profile.
        {
            assert.isTrue(await gunther.issueCommand('/lvp profile 30000'));

            assert.equal(gunther.messages.length, 2);
            assert.equal(gunther.messages[1], Message.format(Message.LVP_PROFILE_STARTED, 30000));
            assert.isTrue(gunther.messages[0].includes(
                              Message.format(Message.LVP_ANNOUNCE_PROFILE_START, gunther.name,
                                             gunther.id, 30000)));

            assert.isNotNull(captureMilliseconds);
            assert.equal(captureMilliseconds, 30000);

            assert.isNotNull(captureFilename);

            [, filename] = captureFilename.split('/');  // basename(captureFilename)

            gunther.clearMessages();
        }

        // (3) It should not allow multiple profiles to run in parallel.
        {
            assert.isTrue(await gunther.issueCommand('/lvp profile 30000'));
            assert.equal(gunther.messages.length, 1);
            assert.equal(gunther.messages[0], Message.LVP_PROFILE_ONGOING);

            gunther.clearMessages();
        }

        await server.clock.advance(30000);  // time of the profile

        // (4) It should inform the issuer and administrators when the profile has finished.
        {
            assert.equal(gunther.messages.length, 2);
            assert.isTrue(gunther.messages[0].includes(
                              Message.format(Message.LVP_ANNOUNCE_PROFILE_FINISHED, gunther.name,
                                             filename)));

            assert.equal(
                gunther.messages[1], Message.format(Message.LVP_PROFILE_FINISHED, filename));
        }
    });

    it('should be able to change boolean settings', async(assert) => {
        const settings = server.featureManager.loadFeature('settings');
        settings.createSettingForTesting({
            category: 'aaa_category',
            setting: 'my_setting',
            type: Setting.TYPE_BOOLEAN,
            value: true,
            description: 'My wonderful boolean setting.'
        });

        gunther.level = Player.LEVEL_MANAGEMENT;

        // (1) Verify that the setting can be disabled.
        gunther.respondToDialog({ listitem: 0 /* Assumed `aaa_category` */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Assumed to be `my_setting` */ })).then(
            () => gunther.respondToDialog({ listitem: 1 /* Disable */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Yeah I get it */ }));

        assert.isTrue(settings.getValue('aaa_category/my_setting'));
        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.isFalse(settings.getValue('aaa_category/my_setting'));

        assert.equal(gunther.messages.length, 1);
        assert.isTrue(gunther.messages[0].includes('my_setting'));
        assert.isTrue(gunther.messages[0].includes('disabled'));

        gunther.clearMessages();

        // (2) Verify that the setting can be enabled.
        gunther.respondToDialog({ listitem: 0 /* Assumed `aaa_category` */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Assumed to be `my_setting` */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* Disable */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Yeah I get it */ }));

        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.isTrue(settings.getValue('aaa_category/my_setting'));

        assert.equal(gunther.messages.length, 1);
        assert.isTrue(gunther.messages[0].includes('my_setting'));
        assert.isTrue(gunther.messages[0].includes('enabled'));
    });

    it('should be able to change numeric settings', async(assert) => {
        const settings = server.featureManager.loadFeature('settings');
        settings.createSettingForTesting({
            category: 'aaa_category',
            setting: 'my_setting',
            type: Setting.TYPE_NUMBER,
            value: 10,
            description: 'My wonderful numeric setting.'
        });

        gunther.level = Player.LEVEL_MANAGEMENT;

        // (1) Change the setting away from its default value.
        gunther.respondToDialog({ listitem: 0 /* Assumed `aaa_category` */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Assumed to be `my_setting` */ })).then(
            () => gunther.respondToDialog({ response: 1, inputtext: '2000' })).then(
            () => gunther.respondToDialog({ response: 1 /* Yeah I get it */ }));

        assert.equal(settings.getValue('aaa_category/my_setting'), 10);
        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.equal(settings.getValue('aaa_category/my_setting'), 2000);

        assert.equal(gunther.messages.length, 1);
        assert.isTrue(gunther.messages[0].includes('my_setting'));
        assert.isTrue(gunther.messages[0].includes('2,000'));

        gunther.clearMessages();

        // (2) Change the setting back to its default value.
        gunther.respondToDialog({ listitem: 0 /* Assumed `aaa_category` */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Assumed to be `my_setting` */ })).then(
            () => gunther.respondToDialog({ response: 1, inputtext: '10' })).then(
            () => gunther.respondToDialog({ response: 1 /* Yeah I get it */ }));

        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.equal(settings.getValue('aaa_category/my_setting'), 10);

        assert.equal(gunther.messages.length, 1);
        assert.isTrue(gunther.messages[0].includes('my_setting'));
        assert.isTrue(gunther.messages[0].includes('10'));
    });

    it('should be able to change textual settings', async(assert) => {
        const settings = server.featureManager.loadFeature('settings');
        settings.createSettingForTesting({
            category: 'aaa_category',
            setting: 'my_setting',
            type: Setting.TYPE_STRING,
            value: 'LVP Radio',
            description: 'My wonderful welcome message.'
        });

        gunther.level = Player.LEVEL_MANAGEMENT;

        // (1) Change the value of the string setting
        gunther.respondToDialog({ listitem: 0 /* Assumed `aaa_category` */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Assumed to be `my_setting` */ })).then(
            () => gunther.respondToDialog({ response: 1, inputtext: 'Hello World' })).then(
            () => gunther.respondToDialog({ response: 1 /* Yeah I get it */ }));

        assert.equal(settings.getValue('aaa_category/my_setting'), 'LVP Radio');
        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.equal(settings.getValue('aaa_category/my_setting'), 'Hello World');

        assert.equal(gunther.messages.length, 1);
        assert.isTrue(gunther.messages[0].includes('my_setting'));
        assert.isTrue(gunther.messages[0].includes('Hello World'));
    });

    // Only non-feature-settings are available to administrators.
    const kBlockedWordsIndex = 0;
    const kCommunicationIndex = 1;
    const kSubstitutionIndex = 2;

    it('should enable administrators to change the blocked words', async (assert) => {

    });

    it('should enable administrators to block and unblock all communication', async (assert) => {
        assert.isFalse(communication.isCommunicationMuted());

        gunther.level = Player.LEVEL_ADMINISTRATOR;

        // (1) Click on the menu option, but then change their mind.
        gunther.respondToDialog({ listitem: kCommunicationIndex }).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.equal(gunther.messages.length, 0);
        
        assert.isFalse(communication.isCommunicationMuted());

        // (2) Disables communication.
        gunther.respondToDialog({ listitem: kCommunicationIndex }).then(
            () => gunther.respondToDialog({ response: 1 /* Disable communication */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Yeah I get it */ }));

        assert.isTrue(await gunther.issueCommand('/lvp settings'));

        assert.isTrue(communication.isCommunicationMuted());
        assert.equal(gunther.messages.length, 2);
        assert.includes(
            gunther.messages[0],
            Message.format(Message.LVP_ANNOUNCE_COMMUNICATION_BLOCKED, gunther.name, gunther.id,
                           'disabled'));

        assert.equal(
            gunther.messages[1], Message.format(Message.COMMUNICATION_SERVER_MUTED, gunther.name));

        // (3) Enables communication.
        gunther.respondToDialog({ listitem: kCommunicationIndex }).then(
            () => gunther.respondToDialog({ response: 1 /* Enable communication */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Yeah I get it */ }));

        assert.isTrue(await gunther.issueCommand('/lvp settings'));

        assert.isFalse(communication.isCommunicationMuted());
        assert.equal(gunther.messages.length, 4);
        assert.includes(
            gunther.messages[2],
            Message.format(Message.LVP_ANNOUNCE_COMMUNICATION_BLOCKED, gunther.name, gunther.id,
                           'enabled'));

        assert.equal(
            gunther.messages[3],
            Message.format(Message.COMMUNICATION_SERVER_UNMUTED, gunther.name));
    });

    it('should enable administrators to change communication substitutions', async (assert) => {

    });

    it('should be able to live reload the message formatting file', async(assert) => {
        gunther.level = Player.LEVEL_MANAGEMENT;

        assert.isTrue(await gunther.issueCommand('/lvp reload messages'));

        assert.equal(gunther.messages.length, 2);
        assert.includes(gunther.messages[0], 'is reloading all in-game messages');  // admin notice
        assert.includes(gunther.messages[1], 'messages have been reloaded');  // acknowledgement
    });
});
