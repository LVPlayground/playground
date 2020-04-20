// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';

// Implementation of a series of commands meant for communication between the IRC server and in-game
// players. This ranges from regular messaging that's available for everyone, to specific messages
// intended for specific players or levels.
export class CommunicationCommands {
    commandManager_ = null;

    constructor(commandManager) {
        this.commandManager_ = commandManager;

        // !admin [message]
        // !announce [message]
        // !pm [player] [message]
        // !msg [message]
        // !say [message]
        // !vip [message]
    }
    
    dispose() {}
}
