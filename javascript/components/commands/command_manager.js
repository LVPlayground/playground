// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ScopedCallbacks } from 'base/scoped_callbacks.js';

// The command manager is responsible for intercepting player commands, and making sure that they
// end up with the command handler that's supposed to be handling them. It uses the full command
// infrastructure to figure out what a player's intention is, and whether they've got access.
export class CommandManager {
    #callbacks_ = null;

    constructor() {
        this.#callbacks_ = new ScopedCallbacks();
        this.#callbacks_.addEventListener(
            'playercommandtext', CommandManager.prototype.onPlayerCommandText.bind(this));
    }

    // Called when a player has issued a command. The |event| will be verified for its integrity and
    // once we're satisfied, will be executed using the CommandExecutor.
    onPlayerCommandText(event) {
        // TODO: Implement our own command handling.

        return server.deprecatedCommandManager.onPlayerCommandText(event);
    }

    dispose() {
        this.#callbacks_.dispose();
    }
}
