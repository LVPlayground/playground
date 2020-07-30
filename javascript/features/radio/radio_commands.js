// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Menu } from 'components/menu/menu.js';
import { MessageBox } from 'components/dialogs/message_box.js';

// Implementation of the `/radio` command that enables players to control their radio-related
// settings, notably their preferred channel and whether the radio should be enabled at all.
class RadioCommands {
    constructor(manager, selection) {
        this.manager_ = manager;
        this.selection_ = selection;

        // The `/radio` command gives players the ability to quickly (and temporarily) stop the
        // radio, as well as the option to change their channel selection.
        server.deprecatedCommandManager.buildCommand('radio')
            .sub('settings')
                .build(RadioCommands.prototype.onRadioSettingsCommand.bind(this))
            .build(RadioCommands.prototype.onRadioCommand.bind(this));

        // TODO(Russell): Support `/radio add`
        // TODO(Russell): Support `/radio remove`
    }

    // Called when the |player| types `/radio settings`. Shows a dialog allowing them to set the
    // radio channel they would like to listen to while on LVP.
    async onRadioSettingsCommand(player) {
        if (!this.manager_.isEnabled()) {
            player.sendMessage(Message.RADIO_FEATURE_DISABLED);
            return;
        }

        const menu = new Menu('Radio settings', ['Channel', 'Language']);

        const hasPreferredChannel = this.manager_.hasPreferredChannelForPlayer(player);
        const preferredChannel =
            hasPreferredChannel ? this.manager_.getPreferredChannelForPlayer(player)
                                : null;

        for (const channel of this.selection_.channels) {
            const highlight = channel === preferredChannel ? '{FFFF00}' : '';
            menu.addItem(highlight + channel.name, highlight + channel.language, async () => {
                this.manager_.setPreferredChannelForPlayer(player, channel);
                await MessageBox.display(player, {
                    title: 'Radio preferences updated!',
                    message: Message.format(Message.RADIO_PREFERRED_CHANNEL_CHANGED, channel.name)
                });
            });
        }

        // Default radio channel.

        const server = (!preferredChannel && !hasPreferredChannel) ? '{FFFF00}' : '{999999}';
        menu.addItem(server + 'Default radio channel', server + '-' /* language */, async () => {
            this.manager_.setPreferredChannelForPlayer(player, '' /* default */);
                await MessageBox.display(player, {
                    title: 'Radio preferences updated!',
                    message: Message.RADIO_PREFERRED_DEFAULT
                });
        });

        // Disable the radio altogether.

        const disable = (!preferredChannel && hasPreferredChannel) ? '{FFFF00}' : '{999999}';
        menu.addItem(disable + 'Disable the radio', disable + '-' /* language */, async () => {
            this.manager_.setPreferredChannelForPlayer(player, null /* disabled */);
                await MessageBox.display(player, {
                    title: 'Radio preferences updated!',
                    message: Message.RADIO_PREFERRED_DISABLED
                });
        });

        await menu.displayForPlayer(player);
    }

    // Called when the |player| types `/radio` without any arguments. Starts or stops the radio
    // if they're in a vehicle. Tells them about `/radio settings` too.
    onRadioCommand(player) {
        if (!this.manager_.isEnabled()) {
            player.sendMessage(Message.RADIO_FEATURE_DISABLED);
            return;
        }

        // Bail out if the |player| is not eligible for listening to the radio right now.
        if (!this.manager_.isEligible(player)) {
            player.sendMessage(Message.RADIO_COMMAND_NOT_ELIGIBLE);
            player.sendMessage(Message.RADIO_COMMAND_SETTINGS_ADVERTISEMENT);
            return;
        }

        const isListening = this.manager_.isListening(player);
        const operation = isListening ? 'stopped' : 'started';

        let channel = null;
        if (isListening) {
            channel = this.manager_.getCurrentChannelForPlayer(player);
            this.manager_.stopRadio(player);
        } else {
            this.manager_.startRadio(player, false /* initialWait */);
            channel = this.manager_.getCurrentChannelForPlayer(player);
        }

        if (channel && channel.name !== null)
            player.sendMessage(Message.RADIO_COMMAND_TOGGLE_LISTENING, operation, channel.name);
        else
            player.sendMessage(Message.RADIO_COMMAND_DISABLED);

        player.sendMessage(Message.RADIO_COMMAND_SETTINGS_ADVERTISEMENT);
    }

    dispose() {
        server.deprecatedCommandManager.removeCommand('radio');
    }
}

export default RadioCommands;
