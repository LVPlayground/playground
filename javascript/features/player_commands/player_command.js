// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// The playerCommand can be used by using /my [playerCommand] [params]
export class PlayerCommand {
    constructor(abuse, announce, finance) {
        this.abuse_ = abuse;
        this.announce_ = announce;
        this.finance_ = finance;
    }

    // Gets the name of the current command. Must be implemented by the command.
    get name() {
        throw new Error('Command::name getter must be implemented by the command.');
    }

    // Builds the command based on |commandBuilder|. Must be implemented by the command.
    build(commandBuilder) {
        throw new Error('Command::build() must be implemented by the command: /' + this.name);
    }

    // Build the admin version o the command based on |commandBuilder|
    buildAdmin(commandBuilder) { }

    dispose() {}
}