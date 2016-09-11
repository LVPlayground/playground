// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const HouseExtension = require('features/houses/house_extension.js');
const Menu = require('components/menu/menu.js');
const MessageBox = require('components/dialogs/message_box.js');
const Question = require('components/dialogs/question.js');

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
    message: 'What would you like your welcome message to be?',
    constraints: {
        validation: Question.defaultValidation(0, 100),
        explanation: 'The welcome message of your house must be at most 100 characters long and ' +
                     'should not contain very exotic characters.',

        abort: 'Sorry, a house must have a valid welcome message!'
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
    }
}

exports = PropertySettings;
