// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Channel from 'features/radio/channel.js';
import { ScopedCallbacks } from 'base/scoped_callbacks.js';
import { TextDraw } from 'components/text_draw/text_draw.js';

// Manager for the radio feature that's responsible for determining whether and when the radio
// should start playing for players.
class RadioManager {
    constructor(selection, settings) {
        this.selection_ = selection;
        this.settings_ = settings;

        this.displayTextDraw_ = new WeakMap();
        this.listening_ = new WeakMap();

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playerstatechange', RadioManager.prototype.onPlayerStateChange.bind(this));
    }

    // Returns whether the radio feature should be enabled at all.
    isEnabled() { return this.settings_().getValue('radio/enabled'); }

    // Returns whether the given |player| is listening to the radio right now.
    isListening(player) { return this.listening_.has(player); }

    // Returns whether the |player| is eligible for listening to the radio. This means that they
    // have to be in a vehicle, unless Management has enabled always-on listening.
    isEligible(player) {
        return player.vehicle !== null ||
               !this.settings_().getValue('radio/restricted_to_vehicles');
    }

    // ---------------------------------------------------------------------------------------------

    // Called when a player's state has changed. Entering or leaving a vehicle will influence
    // whether the radio has to be started or stopped.
    onPlayerStateChange(event) {
        const player = server.playerManager.getById(event.playerid);
        if (!player)
            return;  // invalid player

        const isListening = this.listening_.has(player);
        const shouldBeListening = event.newstate == Player.kStateVehicleDriver ||
                                  event.newstate == Player.kStateVehiclePassenger;

        if (shouldBeListening && !isListening && this.isEnabled())
            this.startRadio(player);
        if (!shouldBeListening && isListening)
            this.stopRadio(player);
    }

    // Starts the radio for the given |player|. Their choice in radio channel, if any at all, will
    // determine what they listen to.
    startRadio(player, initialWait = true) {
        const channel = this.getPreferredChannelForPlayer(player);
        if (!channel)
            return;  // the |player| has opted out of the radio feature

        this.displayRadioChannelName(player, channel, initialWait);

        player.playAudioStream(channel.stream);
        this.listening_.set(player, channel);
    }

    // Displays the name of the |channel| to the |player| in the same style as Grand Theft Auto
    // displays radio channel names. Will change the text's colour after three seconds, and have it
    // automatically disappear after another three seconds.
    async displayRadioChannelName(player, channel, initialWait) {
        if (initialWait)
            await wait(3000);

        {
            if (!player.isConnected() || !this.isListening(player))
                return;  // the player stopped listening to the radio already

            const text = new TextDraw({
                alignment: TextDraw.ALIGN_CENTER,
                color: Color.fromRGB(0xA3, 0x79, 0x10),
                font: TextDraw.FONT_MONOSPACE,
                letterSize: [ 0.519999, 1.899999 ],
                outlineSize: 1,
                position: [ 320, 21 ],
                proportional: true,
                text: channel.name,
            });

            // Store the |text| associated with the |player|.
            this.displayTextDraw_.set(player, text);

            text.displayForPlayer(player);
        }

        await wait(3000);
        {
            const text = this.displayTextDraw_.get(player);
            if (!player.isConnected() || !text)
                return;  // the player disconnected or stopped listening to the radio

            text.hideForPlayer(player);

            // Update the |text|'s colour to fade it out, and then display it again.
            text.color = Color.fromRGB(0xA3, 0xA3, 0xA3);

            text.displayForPlayer(player);
        }

        await wait(3000);
        {
            const text = this.displayTextDraw_.get(player);
            if (!player.isConnected() || !text)
                return;  // the player disconnected or stopped listening to the radio

            text.hideForPlayer(player);
        }
    }

    // Stops the radio for the given |player| given that they're listening to it.
    stopRadio(player) {
        const text = this.displayTextDraw_.get(player);
        if (text) {
            // Hide the |text| from the player's screen as it's not relevant anymore.
            text.hideForPlayer(player);

            // Stop the channel radio name update sequence.
            this.displayTextDraw_.delete(player);
        }

        player.stopAudioStream();
        this.listening_.delete(player);
    }

    // ---------------------------------------------------------------------------------------------

    // Returns the channel that the player is currently listening to, if any.
    getCurrentChannelForPlayer(player) {
        return this.listening_.get(player) || null;
    }

    // Determines if the |player| has selected a preferred channel. Otherwise the default is used.
    hasPreferredChannelForPlayer(player) {
        return player.syncedData.preferredRadioChannel !== '';
    }

    // Determines the channel that the |player| should be listening to. May return NULL if the
    // player has decided to block the radio feature altogether.
    getPreferredChannelForPlayer(player) {
        if (player.syncedData.preferredRadioChannel.length) {
            if (player.syncedData.preferredRadioChannel == '_disabled')
                return null;

            // Find the selected channel in the ChannelSelection.
            for (const channel of this.selection_.channels) {
                if (player.syncedData.preferredRadioChannel === channel.name)
                    return channel;
            }

            // Not found? Reset the player's preference back to default;
            player.syncedData.preferredRadioChannel = '';
        }

        return this.selection_.defaultChannel;
    }

    // Sets the preferred channel for the |player| to |channel|.
    setPreferredChannelForPlayer(player, channel) {
        if (channel instanceof Channel || channel === null)
            player.syncedData.preferredRadioChannel = channel ? channel.name : '_disabled'
        else
            player.syncedData.preferredRadioChannel = ''; /* server default */

        if (!this.isListening(player))
            return;

        this.stopRadio(player);
        this.startRadio(player, false /* initialWait */);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.callbacks_.dispose();
    }
}

export default RadioManager;
