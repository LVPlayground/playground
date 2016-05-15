// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Dictionary of the required settings together with the expected JavaScript variable type.
const REQUIRED_SETTINGS = {
    name: 'string'
};

// Base class that all minigames have to extend. Contains default implementations of the event
// handlers that are available, and makes sure that certain bits of information are available.
class Minigame {
    constructor(settings) {
        // Validate that the |settings| object is complete.
        Object.entries(REQUIRED_SETTINGS).forEach(([name, type]) => {
            if (!settings.hasOwnProperty(name))
                throw new Error('The minigame must have a "' + name + '" setting.');

            if (typeof settings[name] !== type)
                throw new Error('The minigame setting "' + name + '" must be a ' + type + '.');
        });

        this.name_ = settings.name;
    }

    // Gets the name of this minigame. 
    get name() { this.name_; }
}

exports = Minigame;
