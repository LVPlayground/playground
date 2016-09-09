// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Dialog = require('components/dialogs/dialog.js');
const HouseExtension = require('features/houses/house_extension.js');
const Question = require('components/dialogs/question.js');

// Options for asking the player what their house's name should be.
const NAME_QUESTION = {
    question: 'Choose your house\'s name',
    message: 'What would you like your house to be named as?',
    constraints: {
        validation: /^[a-zA-Z0-9àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð\s,\.'\-~_]{3,32}$/u,
        explanation: 'The name of your gang must be between 3 and 32 characters long and should ' +
                     'not contain very exotic characters.',

        abort: 'Sorry, a house must have a valid name!'
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
        menu.addItem('Change the name', location.settings.name, async(player) => {
            const name = await Question.ask(player, NAME_QUESTION);
            if (!name)
                return;  // the player decided to not update the house's name

            await this.manager_.updateHouseSetting(location, 'name', name);

            // Display a confirmation dialog to the player to inform them of their action.
            await Dialog.displayMessage(player, 'Changing the house\'s name',
                                        Message.format(Message.HOUSE_SETTINGS_NAME, name),
                                        'Close' /* leftButton */, '' /* rightButton */);
        });
    }    
}

exports = PropertySettings;
