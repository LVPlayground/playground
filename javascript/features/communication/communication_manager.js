// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ScopedCallbacks from 'base/scoped_callbacks.js';

// The communication manager is responsible for making sure that the different capabilities play
// well together, and is the main entry point for the OnPlayerText callback contents as well.
export class CommunicationManager {
    constructor() {
        this.delegates_ = new Set();

        this.callbacks_ = new ScopedCallbacks();
        this.callbacks_.addEventListener(
            'playertext', CommunicationManager.prototype.onPlayerText.bind(this));
    }

    // ---------------------------------------------------------------------------------------------

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

    // ---------------------------------------------------------------------------------------------

    // Called when a player sends a textual message to the server. This could be one of many things:
    // a chat message to either a specific group of people or everyone, answering a chat message,
    // communicating with another player in a phone call, or one of several other options.
    //
    // The |event| is answered as soon as possible. Actual processing of the message will be done
    // asynchronously, to free up the server for further processing in between server frames.
    onPlayerText(event) {
        const player = server.playerManager.getById(event.playerid);
        const message = event.text;

        if (!player || !message || !message.length)
            return;  // the player is not connected to the server, or they sent an invalid message

        // TODO: Once most communication is handled by JavaScript, do all further processing on a
        // deferred task instead.

        for (let delegate of this.delegates_) {
            if (!!delegate.onPlayerText(player, message)) {
                event.preventDefault();
                return;
            }
        }

        // TODO(Russell): Add further processing here.
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.callbacks_.dispose();
        this.callbacks_ = null;

        this.delegates_.clear();
        this.delegates_ = null;
    }
}
