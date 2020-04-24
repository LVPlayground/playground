// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ChannelSelection from 'features/radio/channel_selection.js';

describe('ChannelSelection', (it, beforeEach, afterEach) => {
    let selection = null;
    let settings = null;

    beforeEach(() => {
        const announce = server.featureManager.loadFeature('announce');

        settings = server.featureManager.loadFeature('settings');
        selection = new ChannelSelection(() => announce, () => settings);
    });

    afterEach(() => selection.dispose());

    // Radio configuration that should be used for testing purposes.
    const TEST_RADIO_CONFIGURATION = [
        {
            name: "LVP Radio",
            language: "English",
            stream: "https://play.sa-mp.nl/stream.pls"
        },
        {
            name: "Fantasy Radio",
            language: "English",
            stream: "https://example.com/stream.pls"
        }
    ];

    it('should be able to load the default configuration', assert => {
        assert.doesNotThrow(() => selection.loadConfiguration());
        assert.isAbove(selection.channels.length, 0);
        assert.isNotNull(selection.defaultChannel);
    });

    it('should be able to reflect configured radio channels', assert => {
        selection.loadConfigurationFromArray(TEST_RADIO_CONFIGURATION);

        assert.equal(selection.channels.length, 2);
        {
            assert.equal(selection.channels[0].name, 'LVP Radio');
            assert.equal(selection.channels[0].stream, 'https://play.sa-mp.nl/stream.pls');

            assert.equal(selection.channels[1].name, 'Fantasy Radio');
            assert.equal(selection.channels[1].stream, 'https://example.com/stream.pls');
        }

        assert.equal(settings.getValue('radio/default_channel'), 'LVP Radio');

        assert.equal(selection.defaultChannel.name, 'LVP Radio');
        assert.equal(selection.defaultChannel.stream, 'https://play.sa-mp.nl/stream.pls');
    });

    it('should be able to update the default radio channel', assert => {
        selection.loadConfigurationFromArray(TEST_RADIO_CONFIGURATION);
        assert.equal(selection.channels.length, 2);

        assert.equal(settings.getValue('radio/default_channel'), 'LVP Radio');
        assert.equal(selection.defaultChannel.name, 'LVP Radio');
        assert.equal(selection.defaultChannel.stream, 'https://play.sa-mp.nl/stream.pls');

        settings.setValue('radio/default_channel', 'Fantasy Radio');

        assert.equal(settings.getValue('radio/default_channel'), 'Fantasy Radio');
        assert.equal(selection.defaultChannel.name, 'Fantasy Radio');
        assert.equal(selection.defaultChannel.stream, 'https://example.com/stream.pls');
    });

    it('should issue a warning when an invalid default channel is configured', assert => {
        selection.loadConfigurationFromArray(TEST_RADIO_CONFIGURATION);
        assert.equal(selection.channels.length, 2);

        const gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify();
        gunther.level = Player.LEVEL_MANAGEMENT;

        assert.equal(settings.getValue('radio/default_channel'), 'LVP Radio');
        assert.equal(selection.defaultChannel.name, 'LVP Radio');

        settings.setValue('radio/default_channel', 'Fantasy Radio');

        assert.equal(settings.getValue('radio/default_channel'), 'Fantasy Radio');
        assert.equal(selection.defaultChannel.name, 'Fantasy Radio');

        // Now change the setting to a radio channel that doesn't exist.
        settings.setValue('radio/default_channel', 'Invalid Channelzz');

        // Administrators should've received a warning.
        {
            assert.equal(gunther.messages.length, 1);
            assert.isTrue(gunther.messages[0].includes('Invalid Channelzz'));
        }

        gunther.clearMessages();

        // The first channel from the configuration should've been made default.
        assert.equal(settings.getValue('radio/default_channel'), 'Invalid Channelzz');
        assert.equal(selection.defaultChannel.name, 'LVP Radio');

        assert.equal(gunther.messages.length, 0);

        // Invalid default channel settings on load should issue a warning too.
        const announce = server.featureManager.loadFeature('announce');
        const secondChannelSelection = new ChannelSelection(() => announce, () => settings);

        secondChannelSelection.loadConfigurationFromArray(TEST_RADIO_CONFIGURATION);

        {
            assert.equal(gunther.messages.length, 1);
            assert.isTrue(gunther.messages[0].includes('Invalid Channelzz'));
        }
    });
});
