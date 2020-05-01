// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Provides account-related commands to the Nuwani bots, usually to enable people outside of the
// game to be able to manage player account data.
export class AccountNuwaniCommands {
    announce_ = null;
    nuwani_ = null;

    // The AccountDatabase instance which will execute operations.
    database_ = null;

    constructor(announce, nuwani, database) {
        this.announce_ = announce;
        this.nuwani_ = nuwani;

        this.database_ = database;
    }

    dispose() {

    }
}