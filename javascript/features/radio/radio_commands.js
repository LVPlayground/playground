// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Implementation of the `/radio` command that enables players to control their radio-related
// settings, notably their preferred channel and whether the radio should be enabled at all.
class RadioCommands {
    constructor(manager, selection) {
        this.manager_ = manager;
        this.selection_ = selection;

        // The `/radio` command gives players the ability to quickly (and temporarily) stop the
        // radio, as well as the option to change their channel selection.
        server.commandManager.buildCommand('radio')
            .sub('options')
                .build(RadioCommands.prototype.onRadioOptionsCommand.bind(this))
            .build(RadioCommands.prototype.onRadioCommand.bind(this));

        // TODO(Russell): Support `/radio add`
        // TODO(Russell): Support `/radio remove`
    }

    // Called when the |player| types `/radio options`. Shows a dialog allowing them to set the
    // radio channel they would like to listen to while on LVP.
    async onRadioOptionsCommand(player) {
        if (!this.manager_.isEnabled()) {
            player.sendMessage(Message.RADIO_FEATURE_DISABLED);
            return;
        }

        // TODO(Russell): Implement `/radio options`.
    }

    // Called when the |player| types `/radio` without any arguments. Starts or stops the radio
    // if they're in a vehicle. Tells them about `/radio options` too.
    onRadioCommand(player) {
        if (!this.manager_.isEnabled()) {
            player.sendMessage(Message.RADIO_FEATURE_DISABLED);
            return;
        }

        if (this.manager_.isEligible(player)) {
            if (this.manager_.isListening(player)) {
                const channel = this.manager_.getCurrentChannelForPlayer(player);
                this.manager_.stopRadio(player);

                player.sendMessage(Message.RADIO_COMMAND_TOGGLE_LISTENING, 'stopped', channel.name);
            }
            else {
                this.manager_.startRadio(player);
                const channel = this.manager_.getCurrentChannelForPlayer(player);

                player.sendMessage(Message.RADIO_COMMAND_TOGGLE_LISTENING, 'started', channel.name);
            }
        } else {
            player.sendMessage(Message.RADIO_COMMAND_NOT_ELIGIBLE);
        }

        player.sendMessage(Message.RADIO_COMMAND_OPTIONS_ADVERTISEMENT);
    }

    dispose() {
        server.commandManager.removeCommand('radio');
    }
}

exports = RadioCommands;
