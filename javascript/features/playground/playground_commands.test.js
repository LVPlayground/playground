// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Setting } from 'entities/setting.js';

describe('PlaygroundCommands', (it, beforeEach) => {
    let communication = null;
    let gunther = null;

    beforeEach(async() => {
        server.featureManager.loadFeature('playground');

        communication = server.featureManager.loadFeature('communication');
        gunther = server.playerManager.getById(0 /* Gunther */);

        await gunther.identify();
    });

    it('should send a different usage message to administrators and management', async (assert) => {
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(await gunther.issueCommand('/lvp'));
        assert.equal(gunther.messages.length, 2);

        gunther.level = Player.LEVEL_MANAGEMENT;

        assert.isTrue(await gunther.issueCommand('/lvp'));
        assert.equal(gunther.messages.length, 4);

        assert.notEqual(gunther.messages[1], gunther.messages[3]);
    });

    it('should be able to create a list of all commands for access controls', async (assert) => {
        gunther.level = Player.LEVEL_MANAGEMENT;

        // Note that only commands from the "Playground" feature will be listed here.
        gunther.respondToDialog({ listitem: 0 /* /lvp */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/lvp access'));
        assert.equal(gunther.getLastDialogAsTable().rows.length, 4);
    });

    it('should be able to change boolean settings', async (assert) => {
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

    it('should be able to change numeric settings', async (assert) => {
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

    it('should be able to change textual settings', async (assert) => {
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
        function hasBlockedWord(checkWord) {
            return !!communication.getBlockedWords().filter(({word}) => word === checkWord).length;
        }

        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isFalse(hasBlockedWord('bananas'));
        assert.isTrue(hasBlockedWord('/quit'));

        // (1) Just viewing the blocked words should be fine.
        gunther.respondToDialog({ listitem: kBlockedWordsIndex }).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.equal(gunther.messages.length, 0);

        // (2) Adding a new blocked word must meet the requirements.
        gunther.respondToDialog({ listitem: kBlockedWordsIndex }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Add a new blocked word */ })).then(
            () => gunther.respondToDialog({ inputtext: 'e' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.equal(gunther.messages.length, 0);

        // (3) Adding a new blocked word must check that it doesn't exist yet.
        gunther.respondToDialog({ listitem: kBlockedWordsIndex }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Add a new blocked word */ })).then(
            () => gunther.respondToDialog({ inputtext: '/quit' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.equal(gunther.messages.length, 0);

        gunther.respondToDialog({ listitem: kBlockedWordsIndex }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Add a new blocked word */ })).then(
            () => gunther.respondToDialog({ inputtext: 'george' /* substitution */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.equal(gunther.messages.length, 0);

        // (4) Adding a new blocked word should work just fine.
        gunther.respondToDialog({ listitem: kBlockedWordsIndex }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Add a new blocked word */ })).then(
            () => gunther.respondToDialog({ inputtext: 'bananas' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.equal(gunther.messages.length, 1);
        assert.includes(
            gunther.messages[0],
            Message.format(Message.LVP_ANNOUNCE_WORD_BLOCKED, gunther.name, gunther.id, 'bananas'));

        assert.isTrue(hasBlockedWord('bananas'));

        // (5) Removing a blocked word should be fine after confirmation.
        gunther.respondToDialog({ listitem: kBlockedWordsIndex }).then(
            () => gunther.respondToDialog({ listitem: 3 /* Assumed to be 'bananas' */ })).then(
            () => gunther.respondToDialog({ inputtext: 'bananas' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.equal(gunther.messages.length, 2);
        assert.includes(
            gunther.messages[1],
            Message.format(Message.LVP_ANNOUNCE_WORD_UNBLOCKED, gunther.name, gunther.id,
                           'bananas'));

        assert.isFalse(hasBlockedWord('bananas'));
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
        function hasSubstitution(value) {
            return !!communication.getReplacements().filter(({before}) => before === value).length;
        }

        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isFalse(hasSubstitution('lucy'));
        assert.isTrue(hasSubstitution('george'));

        // (1) Just viewing the substitutions should be fine.
        gunther.respondToDialog({ listitem: kSubstitutionIndex }).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.equal(gunther.messages.length, 0);

        // (2) Adding a new substitution word must meet the requirements.
        gunther.respondToDialog({ listitem: kSubstitutionIndex }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Add a new substitution */ })).then(
            () => gunther.respondToDialog({ inputtext: 'e' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.equal(gunther.messages.length, 0);

        gunther.respondToDialog({ listitem: kSubstitutionIndex }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Add a new substitution */ })).then(
            () => gunther.respondToDialog({ inputtext: 'Lucy' })).then(
            () => gunther.respondToDialog({ inputtext: '' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.equal(gunther.messages.length, 0);

        // (3) Adding a new substitution must check that it doesn't exist yet.
        gunther.respondToDialog({ listitem: kSubstitutionIndex }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Add a new substitution */ })).then(
            () => gunther.respondToDialog({ inputtext: 'George' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.equal(gunther.messages.length, 0);

        gunther.respondToDialog({ listitem: kSubstitutionIndex }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Add a new substitution */ })).then(
            () => gunther.respondToDialog({ inputtext: '/quit' /* a blocked word */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.equal(gunther.messages.length, 0);

        // (4) Adding a new substitution should work just fine.
        gunther.respondToDialog({ listitem: kSubstitutionIndex }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Add a new substitution */ })).then(
            () => gunther.respondToDialog({ inputtext: 'Lucy' })).then(
            () => gunther.respondToDialog({ inputtext: 'Luce' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.equal(gunther.messages.length, 1);
        assert.includes(
            gunther.messages[0],
            Message.format(Message.LVP_ANNOUNCE_SUBSTITUTION_ADDED, gunther.name, gunther.id,
                           'lucy', 'luce'));

        assert.isTrue(hasSubstitution('lucy'));

        // (5) Removing a substitution should be fine after confirmation.
        gunther.respondToDialog({ listitem: kSubstitutionIndex }).then(
            () => gunther.respondToDialog({ listitem: 3 /* Assumed to be 'Lucy' */ })).then(
            () => gunther.respondToDialog({ inputtext: 'bananas' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/lvp settings'));
        assert.equal(gunther.messages.length, 2);
        assert.includes(
            gunther.messages[1],
            Message.format(Message.LVP_ANNOUNCE_SUBSTITUTION_REMOVED, gunther.name, gunther.id,
                           'lucy'));

        assert.isFalse(hasSubstitution('lucy'));
    });

    it('should be able to live reload the message formatting file', async (assert) => {
        gunther.level = Player.LEVEL_MANAGEMENT;

        assert.isTrue(await gunther.issueCommand('/lvp reload messages'));

        assert.equal(gunther.messages.length, 2);
        assert.includes(gunther.messages[0], 'is reloading all in-game messages');  // admin notice
        assert.includes(gunther.messages[1], 'messages have been reloaded');  // acknowledgement
    });
});
