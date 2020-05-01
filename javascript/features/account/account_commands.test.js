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
        commands = new AccountCommands(() => announce, () => playground, () => settings, database);

        // Give Gunther administrator rights to make most of the commands available.
        gunther.level = Player.LEVEL_ADMINISTRATOR;
    });

    afterEach(() => commands.dispose());

    it('should not work if the player is not registered', async (assert) => {
        assert.isFalse(russell.isRegistered());
        assert.isTrue(await russell.issueCommand('/account'));

        assert.equal(russell.messages.length, 1);
        assert.includes(russell.messages[0], 'is not a registered account');
    });

    it('should fail if there are no available options', async (assert) => {
        russell.identify();

        // TODO: Amend this list as more options are implemented.
        settings.setValue('account/record_visibility', false);

        assert.isTrue(await russell.issueCommand('/account'));

        assert.equal(russell.messages.length, 1);
        assert.includes(russell.messages[0], 'options have been disabled');
    });

    it('should be able to show the record of a player', async (assert) => {
        gunther.identify({ userId: 42 });

        // (1) An error message is shown when the player's log is clean.
        gunther.respondToDialog({ listitem: 0 /* View your record */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.equal(gunther.lastDialogTitle, 'Account management');

        russell.identify({ userId: 1337 });

        // (2) A dialog with entries is shown when the player's log has entries.
        russell.respondToDialog({ listitem: 0 /* View your record */ }).then(
            () => russell.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await russell.issueCommand('/account'));
        assert.equal(russell.lastDialogTitle, 'Player record of Russell');

        const result = russell.getLastDialogAsTable();
        assert.equal(result.rows.length, 2);
        assert.deepEqual(result.rows, [
            [
                '2020-05-01',
                'Kick',
                'Joe',
                'Being too kind',
            ],
            [
                '2020-04-27',
                'Ban',
                'slein',
                '3 day ban for cbug abuse',
            ]
        ]);
    });
});
