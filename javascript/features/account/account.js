// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AccountCommands } from 'features/account/account_commands.js';
import { AccountDatabase } from 'features/account/account_database.js';
import { AccountNuwaniCommands } from 'features/account/account_nuwani_commands.js';
import { Feature } from 'components/feature_manager/feature.js';

import { MockAccountDatabase } from 'features/account/test/mock_account_database.js';

// The account feature centralizes our interaction with player account data, for example their
// ability to log in, manage their account and their settings.
export default class Account extends Feature {
    constructor() {
        super();

        // Depends on the announce feature to make announcements to administrators.
        this.announce_ = this.defineDependency('announce');

        // Depend on the Nuwani feature to be able to announce messages to IRC.
        this.nuwani_ = this.defineDependency('nuwani');
        this.nuwani_.addReloadObserver(this, () => this.initializeNuwaniCommands());

        // Depends on the Settings feature for configurability of individual features.
        const settings = this.defineDependency('settings');

        // The database powers the actual storage layer shared between the commands and other logic
        // provided by this feature. There's only a single instance of it.
        this.database_ = server.isTest() ? new MockAccountDatabase()
                                         : new AccountDatabase();

        // The in-game commands will be made available using this object.
        this.commands_ = new AccountCommands(this.announce_, settings, this.database_);

        this.initializeNuwaniCommands();
    }

    // Initializes the commands provided by this feature that will be made available to people
    // using Nuwani. The module is able to reload itself, which we need to work with.
    initializeNuwaniCommands() {
        this.database_.setPasswordSalt(this.nuwani_().configuration.passwordSalt);
        this.nuwaniCommands_ =
            new AccountNuwaniCommands(this.nuwani_().commandManager, this.database_);        
    }

    dispose() {
        this.nuwaniCommands_.dispose();
        this.commands_.dispose();
    }
}
