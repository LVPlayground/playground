// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const CommunicationManager = require('features/communication/communication_manager.js');
const Feature = require('components/feature_manager/feature.js');

// The communication feature manages the low-level communicative capabilities of players, for
// example the main chat, interactive commands and can defer to delegates for more specific chats,
// for example administrator, gang and and VIP chats.
class Communication extends Feature {
    constructor() {
        super();

        this.manager_ = new CommunicationManager();
    }

    // ---------------------------------------------------------------------------------------------
    // Public API of the communication feature.
    // ---------------------------------------------------------------------------------------------

    // Adds |delegate| to the list of delegates that will be given the chance to handle a chat
    // message before normal processing continues. The `onPlayerChat` method must exist on the
    // prototype of the |delegate|, which will be invoked with player and message arguments.
    // Returning TRUE from this function indicates that the message has been delegated, and will
    // prevent further processing from happening.
    addDelegate(delegate) {
        this.manager_.addDelegate(delegate);
    }

    // Removes |delegate| from the list of chat delegates. They will no longer be considered for
    // future incoming chat messages.
    removeDelegate(delegate) {
        this.manager_.removeDelegate(delegate);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.manager_.dispose();
    }
}

exports = Communication;
