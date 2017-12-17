// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ChannelSelection = require('features/radio/channel_selection.js');
const MockAnnounce = require('features/announce/test/mock_announce.js');
const RadioManager = require('features/radio/radio_manager.js');

describe('RadioManager', (it, beforeEach, afterEach) => {
    let manager = null;
    let settings = null;

    beforeEach(() => {
        settings = server.featureManager.loadFeature('settings');

        const announce = new MockAnnounce();
        const selection = new ChannelSelection(() => announce, () => settings);
        selection.loadConfigurationFromArray([
            {
                name: "LVP Radio",
                stream: "https://play.sa-mp.nl/stream.pls"
            }
        ]);

        manager = new RadioManager(selection, () => settings);
    });

    afterEach(() => {
        manager.selection_.dispose();
        manager.dispose();
    });

    it('should keep track of whether the feature is enabled', assert => {
        assert.isTrue(settings.getValue('radio/enabled'));
        assert.isTrue(manager.isEnabled());

        settings.setValue('radio/enabled', false);

        assert.isFalse(settings.getValue('radio/enabled'));
        assert.isFalse(manager.isEnabled());
    });
});
