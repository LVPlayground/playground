// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AccountManager } from 'features/account_provider/account_manager.js';
import { AccountProviderDatabase } from 'features/account_provider/account_provider_database.js';
import { Feature } from 'components/feature_manager/feature.js';
import { MockAccountProviderDatabase } from 'features/account_provider/test/mock_account_provider_database.js';
import { PlayerAccountSupplement } from 'features/account_provider/player_account_supplement.js';

// Provides the account information for the rest of the gamemode. Foundational component that must
// not depend on anything else in the system, as this will be loaded by default.
export default class AccountProvider extends Feature {
    database_ = null;
    manager_ = null;

    constructor() {
        super();

        // This is a foundational feature.
        this.markFoundational();

        // Depend on the PlayerColors feature, where colour information still be stored.
        this.defineDependency('player_colors');

        // Depend on the PlayerStats feature, where certain statistics will be stored. It provides
        // a Supplement that we expect to be available.
        this.defineDependency('player_stats');

        // The database powers the actual storage layer shared between the commands and other logic
        // provided by this feature. There's only a single instance of it.
        this.database_ = server.isTest() ? new MockAccountProviderDatabase()
                                         : new AccountProviderDatabase();

        // The account manager, responsible for keeping track of account data & saving thereof.
        this.manager_ = new AccountManager(this.database_);

        // Provide the Account supplement to the Player class. This makes the `account` accessor
        // available on each player connected to the server.
        Player.provideSupplement('account', PlayerAccountSupplement, this.manager_);
    }

    dispose() {
        Player.provideSupplement('account', null);

        this.manager_.dispose();
        this.manager_ = null;

        this.database_ = null;
    }
}
