// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/command_manager/command_builder.js';

// Implementation of a series of commands that enables administrators to revoke access from certain
// players, IP addresses and serial numbers from the server, as well as understanding why someone
// might not have access. This includes a series of tools for understanding IP and serial usage.
export class BanCommands {
    commandManager_ = null;

    constructor(commandManager) {
        this.commandManager_ = commandManager;

        // !ban [player] [days=3] [reason]
        // !ban ip [ip] [playerName] [days] [reason]
        // !ban range [ip range] [playerName] [days] [reason]
        // !ban serial [gpci] [playerName] [days] [reason]
        // !lastbans
        // !ipinfo [ip | ip range]
        // !ipinfo [nickname]
        // !serialinfo [serial]
        // !serialinfo [nickname]
        // !why [nickname]
        // !addnote [nickname] [note]
        // !unban [ip | ip range | serial] [note]
    }
    
    dispose() {}
}
