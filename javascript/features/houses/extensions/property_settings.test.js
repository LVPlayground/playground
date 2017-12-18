// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import createTestEnvironment from 'features/houses/test/test_environment.js';

// Zero-based index of the Property Settings menu in the `/house settings` options.
const SETTINGS_MENU_INDEX = 2;

describe('PropertySettings', (it, beforeEach) => {
    let gunther = null;
    let location = null;
    let manager = null;

    beforeEach(async(assert) => {
        gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify({ userId: 42, vip: 1 });

        ({ manager } = await createTestEnvironment());

        // The `/house settings` command is only available when the player is in a house.
        manager.forceEnterHouse(
            gunther, await manager.findClosestLocation(gunther, { ignoreAvailable: true }));

        location = manager.getCurrentHouseForPlayer(gunther);

        assert.isNotNull(location);
        assert.isFalse(location.isAvailable());
    });

    it('should only display VIP menu items to those who are VIPs', async(assert) => {
        // List of menu options that will be reserved for VIP members.
        const restrictedOptions = [
            'Change the entrance color'
        ];

        gunther.setVip(false);
        {
            gunther.respondToDialog({ listitem: SETTINGS_MENU_INDEX }).then(
                () => gunther.respondToDialog({ response: 0 /* Close the menu */ }));

            assert.isTrue(await gunther.issueCommand('/house settings'));

            restrictedOptions.forEach(option =>
                assert.isFalse(gunther.lastDialog.includes(option)));
        }

        gunther.setVip(true);
        {
            gunther.respondToDialog({ listitem: SETTINGS_MENU_INDEX }).then(
                () => gunther.respondToDialog({ response: 0 /* Close the menu */ }));

            assert.isTrue(await gunther.issueCommand('/house settings'));

            restrictedOptions.forEach(option =>
                assert.isTrue(gunther.lastDialog.includes(option)));
        }
    });

    it('should allow house name to be updated', async(assert) => {
        assert.equal(location.settings.name, 'Guntherplaza');

        gunther.respondToDialog({ listitem: SETTINGS_MENU_INDEX }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Change the name */ })).then(
            () => gunther.respondToDialog({ inputtext: 'Gunther Pro Palace' })).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.equal(location.settings.name, 'Gunther Pro Palace');
    });

    it('should allow house welcome message to be updated', async(assert) => {
        assert.equal(location.settings.welcomeMessage, '');

        gunther.respondToDialog({ listitem: SETTINGS_MENU_INDEX }).then(
            () => gunther.respondToDialog({ listitem: 1 /* Change the welcome message */ })).then(
            () => gunther.respondToDialog({ inputtext: 'OMG Welcome!!?!' })).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.equal(location.settings.welcomeMessage, 'OMG Welcome!!?!');

        gunther.respondToDialog({ listitem: SETTINGS_MENU_INDEX }).then(
            () => gunther.respondToDialog({ listitem: 1 /* Change the welcome message */ })).then(
            () => gunther.respondToDialog({ inputtext: '' })).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.equal(location.settings.welcomeMessage, '');
    });

    it('should display the welcome message when entering a house', async(assert) => {
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.HOUSE_WELCOME, gunther.name));

        gunther.clearMessages();

        location.settings.welcomeMessage = 'Hello, world!';

        manager.forceExitHouse(gunther, location);
        manager.forceEnterHouse(gunther, location);

        assert.equal(gunther.messages.length, 2);
        assert.equal(gunther.messages[0],
                     Message.format(Message.HOUSE_WELCOME_MESSAGE, gunther.name, 'Hello, world!'));
        assert.equal(gunther.messages[1], Message.format(Message.HOUSE_WELCOME, gunther.name));
    });

    it('should allow VIPs to update the color of their entrance marker', async(assert) => {
        assert.equal(location.settings.markerColor, 'yellow');

        gunther.respondToDialog({ listitem: SETTINGS_MENU_INDEX }).then(
            () => gunther.respondToDialog({ listitem: 2 /* Change the entrance color */ })).then(
            () => gunther.respondToDialog({ listitem: 3 /* Blue */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.equal(location.settings.markerColor, 'blue');
    });

    it('should allow VIPs to update the audio stream URL of their house', async(assert) => {
        assert.isFalse(location.settings.hasAudioStream());
        assert.isNull(gunther.streamUrl);

        gunther.respondToDialog({ listitem: SETTINGS_MENU_INDEX }).then(
            () => gunther.respondToDialog({ listitem: 3 /* Change the stream URL */ })).then(
            () => gunther.respondToDialog({ inputtext: 'https://example.com/foo.mp3' })).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.isTrue(location.settings.hasAudioStream());
        assert.equal(location.settings.streamUrl, 'https://example.com/foo.mp3');
        assert.equal(gunther.streamUrl, 'https://example.com/foo.mp3');

        gunther.respondToDialog({ listitem: SETTINGS_MENU_INDEX }).then(
            () => gunther.respondToDialog({ listitem: 3 /* Change the stream URL */ })).then(
            () => gunther.respondToDialog({ inputtext: '' })).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.isFalse(location.settings.hasAudioStream());
        assert.isNull(gunther.streamUrl);
    });

    it('should allow house spawn settings to be updated', async(assert) => {
        assert.isFalse(location.settings.isSpawn());

        gunther.respondToDialog({ listitem: SETTINGS_MENU_INDEX }).then(
            () => gunther.respondToDialog({ listitem: 4 /* Spawn at this house */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.isTrue(location.settings.isSpawn());

        gunther.respondToDialog({ listitem: SETTINGS_MENU_INDEX }).then(
            () => gunther.respondToDialog({ listitem: 4 /* Spawn at this house */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Yes, I get it */ }));

        assert.isTrue(await gunther.issueCommand('/house settings'));
        assert.isFalse(location.settings.isSpawn());
    });

    it('should start and stop the audio stream for a location when expected', async(assert) => {
        manager.forceExitHouse(gunther, location);

        location.settings.streamUrl = 'http://example.com/mystream.mp3';

        assert.isNull(gunther.streamUrl);
        manager.forceEnterHouse(gunther, location);
        assert.equal(gunther.streamUrl, 'http://example.com/mystream.mp3');
        manager.forceExitHouse(gunther, location);
        assert.isNull(gunther.streamUrl);
    });
});
