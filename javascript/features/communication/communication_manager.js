// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedCallbacks = require('base/scoped_callbacks.js');

// The communication manager is responsible for making sure that the different capabilities play
// well together, and is the main entry point for the OnPlayerText callback contents as well.
class CommunicationManager {
    constructor() {
        this.delegates_ = new Set();

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playertext', CommunicationManager.prototype.onPlayerText.bind(this));
    }

    // Adds |delegate| to the list of delegates that will be given the chance to handle a chat
    // message before normal processing continues.
    addDelegate(delegate) {
        if (!delegate.__proto__.hasOwnProperty('onPlayerText'))
            throw new Error('The |delegate| must implement the onPlayerText method.');

        this.delegates_.add(delegate);
    }

    // Removes |delegate| from the list of chat delegates. They will no longer be considered for
    // future incoming chat messages.
    removeDelegate(delegate) {
        this.delegates_.delete(delegate);
    }

    // Called when a player sends a textual message to the server. This could be one of many things:
    // a chat message to either a specific group of people or everyone, answering a chat message,
    // communicating with another player in a phone call, or one of several other options.
    onPlayerText(event) {
        const player = server.playerManager.getById(event.playerid);
        const message = event.text;

        if (!player || !message || !message.length)
            return;  // the player is not connected to the server, or they sent an invalid message

        for (let delegate of this.delegates_) {
            const handled = delegate.onPlayerText(player, message);
            if (typeof handled !== 'boolean') {
                throw new Error('The onPlayerText method must return a boolean: ' +
                                delegate.constructor.name);
            }

            if (handled) {
                event.preventDefault();
                return;
            }
        }

        // TODO(Russell): Add further processing here.
    }

    dispose() {
        this.callbacks_.dispose();
    }
}

exports = CommunicationManager;
