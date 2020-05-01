// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AccountCommands } from 'features/account/account_commands.js';
import { MockAccountDatabase } from 'features/account/test/mock_account_database.js';

describe('AccountCommands', (it, beforeEach, afterEach) => {
    let commands = null;
    let database = null;

    let gunther = null;
    let playground = null;
    let russell = null;
    let settings = null;

    beforeEach(() => {
        const announce = server.featureManager.loadFeature('announce');
        
        database = new MockAccountDatabase();
        gunther = server.playerManager.getById(0 /* Gunther */);
        playground = server.featureManager.loadFeature('playground');
        russell = server.playerManager.getById(1 /* Russell */);
        settings = server.featureManager.loadFeature('settings');

        // Create the commands so that the server is aware of them.
        commands = new AccountCommands(() => announce, () => playground, database, settings);

        // Give Gunther administrator rights to make most of the commands available.
        gunther.level = Player.LEVEL_ADMINISTRATOR;
    });

    afterEach(() => commands.dispose());

    it.fails();
});
