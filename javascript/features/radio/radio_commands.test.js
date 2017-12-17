// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const RadioCommands = require('features/radio/radio_commands.js');

describe('RadioCommands', (it, beforeEach) => {
    let gunther = null;
    let commands = null;
    let manager = null;
    let selection = null;
    let settings = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('radio');

        commands = feature.commands_;
        manager = feature.manager_;
        selection = feature.selection_;
        settings = server.featureManager.loadFeature('settings');

        gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify();
    });

    it('should disable the commands when the radio feature is unavailable', async assert => {
        settings.setValue('radio/enabled', false);
        assert.isFalse(manager.isEnabled());

        // Command: /radio
        {
            await gunther.issueCommand('/radio');

            assert.equal(gunther.messages.length, 1);
            assert.equal(gunther.messages[0], Message.RADIO_FEATURE_DISABLED);

            gunther.clearMessages();
        }

        // Command: /radio settings
        {
            await gunther.issueCommand('/radio settings');

            assert.equal(gunther.messages.length, 1);
            assert.equal(gunther.messages[0], Message.RADIO_FEATURE_DISABLED);
        }
    });

    it('should enable players to toggle the radio anywhere w/o restrictions', async assert => {
        settings.setValue('radio/restricted_to_vehicles', false);
        assert.isTrue(manager.isEnabled());
        assert.isTrue(manager.isEligible(gunther));

        // Command while not in a vehicle, should succeed.
        {
            assert.isNull(gunther.vehicle);
            assert.isFalse(manager.isListening(gunther));

            await gunther.issueCommand('/radio');

            assert.isTrue(manager.isListening(gunther));

            const channel = manager.getCurrentChannelForPlayer(gunther);
            assert.isNotNull(channel);

            assert.equal(gunther.messages.length, 2);
            assert.equal(
                gunther.messages[0],
                Message.format(Message.RADIO_COMMAND_TOGGLE_LISTENING, 'started', channel.name));
        }
    });

    it('should enable players to toggle the radio whilst in a vehicle', async assert => {
        settings.setValue('radio/restricted_to_vehicles', true);
        assert.isTrue(manager.isEnabled());
        assert.isFalse(manager.isEligible(gunther));

        const vehicle = server.vehicleManager.createVehicle({
            modelId: 411 /* Infernus */,
            position: new Vector(1500, 1000, 10)
        });

        // Command whilst outside of a vehicle (not eligible)
        {
            await gunther.issueCommand('/radio');

            assert.equal(gunther.messages.length, 2);
            assert.equal(gunther.messages[0], Message.RADIO_COMMAND_NOT_ELIGIBLE);
            assert.isFalse(manager.isListening(gunther));

            gunther.clearMessages();
        }

        // Command while driving a vehicle (disable the radio)
        {
            gunther.enterVehicle(vehicle, 0 /* driver seat */);
            assert.isTrue(manager.isListening(gunther));

            const channel = manager.getCurrentChannelForPlayer(gunther);
            assert.isNotNull(channel);

            await gunther.issueCommand('/radio');

            assert.isFalse(manager.isListening(gunther));
            assert.equal(gunther.messages.length, 2);
            assert.equal(
                gunther.messages[0],
                Message.format(Message.RADIO_COMMAND_TOGGLE_LISTENING, 'stopped', channel.name));

            gunther.clearMessages();
        }

        // Command while driving a vehicle (enable the radio)
        {
            await gunther.issueCommand('/radio');

            assert.isTrue(manager.isListening(gunther));

            const channel = manager.getCurrentChannelForPlayer(gunther);
            assert.isNotNull(channel);

            assert.equal(gunther.messages.length, 2);
            assert.equal(
                gunther.messages[0],
                Message.format(Message.RADIO_COMMAND_TOGGLE_LISTENING, 'started', channel.name));
        }
    });

    it('should show an advertisement for the `settings` command', async assert => {
        settings.setValue('radio/restricted_to_vehicles', false);
        assert.isTrue(manager.isEnabled());
        assert.isTrue(manager.isEligible(gunther));

        {
            await gunther.issueCommand('/radio');

            assert.equal(gunther.messages.length, 2);
            assert.equal(gunther.messages[1], Message.RADIO_COMMAND_SETTINGS_ADVERTISEMENT);
        }
    });

    it('should allow players to change their preferred radio channel', async assert => {
        assert.isTrue(manager.isEnabled());
        assert.equal(manager.getPreferredChannelForPlayer(gunther), selection.defaultChannel);

        {
            // Mimics Gunther selecting the last channel, which we assume to *not* be the default.
            const alternativeChannel = selection.channels[selection.channels.length - 1];

            assert.notEqual(alternativeChannel, selection.defaultChannel);

            gunther.respondToDialog({ listitem: selection.channels.length - 1 }).then(
                () => gunther.respondToDialog({ response: 1 /* Yeah I get it */ }));

            await gunther.issueCommand('/radio settings');

            assert.equal(manager.getPreferredChannelForPlayer(gunther), alternativeChannel);
        }
    });

    it('should allow players to fall back to the default radio channel', async assert => {
        assert.isTrue(manager.isEnabled());
        assert.equal(manager.getPreferredChannelForPlayer(gunther), selection.defaultChannel);

        const alternativeChannel = selection.channels[selection.channels.length - 1];
        manager.setPreferredChannelForPlayer(gunther, alternativeChannel);

        assert.equal(manager.getPreferredChannelForPlayer(gunther), alternativeChannel);

        {
            // Mimics Gunther selecting the default radio channel option.
            gunther.respondToDialog({ listitem: selection.channels.length }).then(
                () => gunther.respondToDialog({ response: 1 /* Yeah I get it */ }));

            await gunther.issueCommand('/radio settings');

            assert.equal(manager.getPreferredChannelForPlayer(gunther), selection.defaultChannel);
        }
    });

    it('should allow players to disable the radio altogether', async assert => {
        assert.isTrue(manager.isEnabled());
        assert.equal(manager.getPreferredChannelForPlayer(gunther), selection.defaultChannel);

        {
            // Mimics Gunther disabling the radio feature altogether. (Last option.)
            gunther.respondToDialog({ listitem: selection.channels.length + 1 }).then(
                () => gunther.respondToDialog({ response: 1 /* Yeah I get it */ }));

            await gunther.issueCommand('/radio settings');

            assert.equal(manager.getPreferredChannelForPlayer(gunther), null);
        }
    });
});

