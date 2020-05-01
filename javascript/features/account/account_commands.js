// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Provides access to in-game commands related to account management. Access to the individual
// abilities is gated through the Playground feature, which manages command access.
export class AccountCommands {
    announce_ = null;
    playground_ = null;

    // The AccountDatabase instance which will execute operations.
    database_ = null;

    constructor(announce, playground, database) {
        this.announce_ = announce;
        this.playground_ = playground;

        this.database_ = database;
    }

    dispose() {

    }
}