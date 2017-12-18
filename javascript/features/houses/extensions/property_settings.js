// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import HouseExtension from 'features/houses/house_extension.js';
import Menu from 'components/menu/menu.js';
import MessageBox from 'components/dialogs/message_box.js';
import Question from 'components/dialogs/question.js';

// Options for asking the player what their house's name should be.
const NAME_QUESTION = {
    question: 'Choose the new name',
    message: 'What would you like your house to be named as?',
    constraints: {
        validation: Question.defaultValidation(3, 32),
        explanation: 'The name of your house must be between 3 and 32 characters long and should ' +
                     'not contain very exotic characters.',

        abort: 'Sorry, a house must have a valid name!'
    }
};

// Options for asking a player what the welcome message for their house should be.
const WELCOME_MESSAGE_QUESTION = {
    question: 'Choose the new message',
    message: 'What would you like your welcome message to be? (Leave empty to disable.)',
    constraints: {
        validation: Question.defaultValidation(0, 100),
        explanation: 'The welcome message of your house must be at most 100 characters long and ' +
                     'should not contain very exotic characters.',

        abort: 'Sorry, a house must have a valid welcome message!'
    }
};

// Options for asking the player what audio stream URL they would like to play.
const STREAM_URL_QUESTION = {
    question: 'Choose the audio stream URL',
    message: 'What is the URL of the MP3 file to play? (Leave empty to disable.)',
    constraints: {
        validation: /(^$|(^https?:\/\/(.+){8,246}$))/,
        explanation: 'The audio stream URL of your house must be at most 256 characters long and ' +
                     'begin with "http://", either to an MP3 file or a radio station.',

        abort: 'Sorry, a house must have a valid audio stream URL!'
    }
};

// Houses have a number of settings associated with them in regards to their property: the house's
// name, colour of the entrance marker, and so on. These options are provided by this extension.
class PropertySettings extends HouseExtension {
    constructor(manager) {
        super();

        this.manager_ = manager;
    }

    // Adds a menu item to |menu| that enables the player to change the property settings of their
    // house. The updates will be applied through the HouseManager.
    onHouseSettingsCommand(player, location, menu) {
        menu.addItem('Property settings', '-', async(player) => {
            const settingsMenu =
                new Menu('How to change your property?', ['Setting', 'Current value']);

            const VIP = ' {FFFF00}**';

            const nameValue = location.settings.name;
            const welcomeValue = location.settings.welcomeMessage;
            const spawnValue = location.settings.isSpawn() ? '{FFFF00}Yes' : 'No';

            settingsMenu.addItem('Change the name', nameValue, async(player) => {
                const name = await Question.ask(player, NAME_QUESTION);
                if (!name)
                    return;  // the player decided to not update the house's name

                await this.manager_.updateHouseSetting(location, 'name', name);

                // Display a confirmation dialog to the player to inform them of their action.
                await MessageBox.display(player, {
                    title: 'The new name has been stored!',
                    message: Message.format(Message.HOUSE_SETTINGS_NAME, name)
                });
            });

            settingsMenu.addItem('Change the welcome message', welcomeValue, async(player) => {
                const message = await Question.ask(player, WELCOME_MESSAGE_QUESTION);
                if (message === null)
                    return;  // the player decided to not update the house's welcome message

                await this.manager_.updateHouseSetting(location, 'welcome', message);

                // Display a confirmation dialog to the player to inform them of their action.
                await MessageBox.display(player, {
                    title: 'The new welcome message has been stored!',
                    message: Message.HOUSE_SETTINGS_WELCOME_MESSAGE
                });
            });

            if (player.isVip()) {
                const colorValue = this.toColorDescription(location.settings.markerColor);
                const streamValue = location.settings.hasAudioStream() ? location.settings.streamUrl
                                                                       : '{CCCCCC}None';

                settingsMenu.addItem('Change the entrance color' + VIP, colorValue, async(player) => {
                    const colors = [
                        { value: 'yellow', label: 'Yellow' },
                        { value: 'red', label: 'Red' },
                        { value: 'green', label: 'Green' },
                        { value: 'blue', label: 'Blue '}
                    ];

                    const colorMenu = new Menu('Which color would you like?');

                    for (const color of colors) {
                        const labelPrefix =
                            location.settings.markerColor === color.value ? '{FFFF00}' : '';

                        colorMenu.addItem(labelPrefix + color.label, async(player) => {
                            await this.manager_.updateHouseSetting(location, 'marker', color.value);

                            // Display a confirmation dialog to inform the player of their action.
                            await MessageBox.display(player, {
                                title: 'Your entrance marker has been updated!',
                                message: Message.format(Message.HOUSE_SETTINGS_COLOR, color.value)
                            });
                        });
                    }

                    await colorMenu.displayForPlayer(player);
                });

                settingsMenu.addItem('Change the audio stream' + VIP, streamValue, async(player) => {
                    const stream = await Question.ask(player, STREAM_URL_QUESTION);
                    if (stream === null)
                        return;  // the player decided to not update the house's audio stream

                    const hasStream = !!stream.length;

                    await this.manager_.updateHouseSetting(location, 'stream', stream);

                    // Synchronize the audio playback for any player that may be in the |location|.
                    server.playerManager.forEach(visitor => {
                        if (this.manager_.getCurrentHouseForPlayer(visitor) !== location)
                            return;  // the |visitor| is not in the |location|

                        if (hasStream)
                            visitor.playAudioStream(stream);
                        else
                            visitor.stopAudioStream();
                    });

                    // Display a confirmation dialog to the player to inform them of their action.
                    await MessageBox.display(player, {
                        title: 'The audio stream has been updated!',
                        message: Message.HOUSE_SETTINGS_WELCOME_MESSAGE
                    });
                });
            }

            settingsMenu.addItem('Spawn at this house', spawnValue, async(player) => {
                await this.manager_.updateHouseSetting(
                    location, 'spawn', !location.settings.isSpawn());

                // Display a confirmation dialog to the player to inform them of their action.
                await MessageBox.display(player, {
                    title: 'Spawning at your house',
                    message: location.settings.isSpawn() ? Message.HOUSE_SETTINGS_SPAWN_ENABLED
                                                         : Message.HOUSE_SETTINGS_SPAWN_DISABLED
                });
            });

            await settingsMenu.displayForPlayer(player);
        });
    }

    // Converts the |color| to a colored representation of the word to describe it.
    toColorDescription(color) {
        switch (color) {
            case 'blue':
                return '{0000FF}Blue';
            case 'green':
                return '{00FF00}Green';
            case 'red':
                return '{FF0000}Red';
            case 'yellow':
                return '{FFFF00}Yellow';
            default:
                throw new Error('Invalid color given: ' + color);
        }
    }

    // Called when |player| enters the |location|. Displays the welcome message to them when one
    // has been configured, or a default message otherwise. A separate message will also be shown
    // when the |player| is the owner of the house.
    onPlayerEnterHouse(player, location) {
        const welcomeMessage = location.settings.welcomeMessage;
        if (welcomeMessage.length) {
            player.sendMessage(
                Message.HOUSE_WELCOME_MESSAGE, location.settings.ownerName, welcomeMessage);
        }

        if (player.userId === location.settings.ownerId)
            player.sendMessage(Message.HOUSE_WELCOME, player.name);

        if (location.settings.hasAudioStream())
            player.playAudioStream(location.settings.streamUrl);
    }

    // Called when the |player| has left the |location|. The audio stream will be stopped when the
    // house has a valid stream, to make sure the user stops listening to the.. enforced music.
    onPlayerLeaveHouse(player, location) {
        if (location.settings.hasAudioStream())
            player.stopAudioStream();
    }
}

export default PropertySettings;
