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
        settings.setValue('account/session_visibility', false);

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
                'May 1, 2020',
                'Kick',
                'Joe',
                'Being too kind',
            ],
            [
                'April 27, 2020',
                'Ban',
                'slein',
                '3 day ban for cbug abuse',
            ]
        ]);
    });

    it('should be able to display the recent sessions of a player', async (assert) => {
        gunther.identify({ userId: 42 });

        // (1) An error message is shown when the player's log is clean.
        gunther.respondToDialog({ listitem: 1 /* View your recent sessions */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.equal(gunther.lastDialogTitle, 'Account management');

        russell.identify({ userId: 1337 });

        // (2) A dialog with entries is shown when the player's log has entries.
        russell.respondToDialog({ listitem: 1 /* View your recent sessions */ }).then(
            () => russell.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await russell.issueCommand('/account'));
        assert.equal(russell.lastDialogTitle, 'Recent sessions of Russell');

        const result = russell.getLastDialogAsTable();
        assert.equal(result.rows.length, 3);
        assert.deepEqual(result.rows, [
            [
                'May 1, 2020 at 2:15 PM',
                '[BB]GoodJoe',
                '1:00:25',
                '37.48.87.211',
            ],
            [
                'May 1, 2020 at 2:10 PM',
                '[BB]GoodJoe',
                '0:03:31',
                '37.48.87.211',
            ],
            [
                'April 9, 2020 at 10:41 AM',
                '[BB]Joe',
                '0:03:54',
                '37.48.87.211',
            ],
        ]);
    });

    it('is able to format dates for display', async (assert) => {
        assert.equal(commands.formatDate(new Date('xxx')), '[invalid date]');
        assert.equal(commands.formatDate(new Date('2020-05-01 14:12:15')), 'May 1, 2020');
        assert.equal(commands.formatDate(new Date('2020-01-11 10:01:12')), 'January 11, 2020');
        assert.equal(commands.formatDate(new Date('2019-12-30 22:15:11')), 'December 30, 2019');

        assert.equal(commands.formatDate(new Date('2020-05-01 14:12:15'), true),
                     'May 1, 2020 at 2:12 PM');
        assert.equal(commands.formatDate(new Date('2020-01-11 10:01:12'), true),
                     'January 11, 2020 at 10:01 AM');
        assert.equal(commands.formatDate(new Date('2019-12-30 22:15:11'), true),
                     'December 30, 2019 at 10:15 PM');
    });

    it('is able to format duration', async (assert) => {
        assert.equal(commands.formatDuration(0), '0:00:00');
        assert.equal(commands.formatDuration(1), '0:00:01');
        assert.equal(commands.formatDuration(30), '0:00:30');
        assert.equal(commands.formatDuration(60), '0:01:00');
        assert.equal(commands.formatDuration(61), '0:01:01');
        assert.equal(commands.formatDuration(3599), '0:59:59');
        assert.equal(commands.formatDuration(3600), '1:00:00');
        assert.equal(commands.formatDuration(5400), '1:30:00');
        assert.equal(commands.formatDuration(36000), '10:00:00');
    });
});
