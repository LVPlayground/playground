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
        database.setPasswordSalt('s4lt$');

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

        // TODO: Change nickname
        settings.setValue('account/password_control', false);
        // TODO: Manage aliases
        settings.setValue('account/record_visibility', false);
        settings.setValue('account/session_visibility', false);

        assert.isTrue(await russell.issueCommand('/account'));

        assert.equal(russell.messages.length, 1);
        assert.includes(russell.messages[0], 'options have been disabled');
    });

    // TODO: Change nickname

    it('should enable players to change their password', async (assert) => {
        assert.isTrue(database.canUpdatePasswords());
        
        gunther.identify({ userId: 42 });

        // (1a) The player is able to abort the flow to change their password.
        gunther.respondToDialog({ listitem: 0 /* Change your password */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));

        assert.equal(database.passwordQueries.length, 0);
        assert.equal(database.changePassQueries.length, 0);

        // (1b) Abort after verification of their current password.
        gunther.respondToDialog({ listitem: 0 /* Change your password */ }).then(
            () => gunther.respondToDialog({ inputtext: 'correct-pass' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
            
        assert.equal(database.passwordQueries.length, 1);
        assert.equal(database.changePassQueries.length, 0);

        // (2) The flow aborts if the current password cannot be verified.
        gunther.respondToDialog({ listitem: 0 /* Change your password */ }).then(
            () => gunther.respondToDialog({ inputtext: 'wrong-pass' })).then(
            () => gunther.respondToDialog({ response: 1 /* Try again */ })).then(
            () => gunther.respondToDialog({ inputtext: 'invalid-pass' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));

        assert.equal(database.passwordQueries.length, 2);
        assert.equal(database.changePassQueries.length, 0);

        // (3) The flow should refuse password that are not strong enough.
        gunther.respondToDialog({ listitem: 0 /* Change your password */ }).then(
            () => gunther.respondToDialog({ inputtext: 'correct-pass' })).then(
            () => gunther.respondToDialog({ inputtext: 'weak' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));

        assert.equal(database.passwordQueries.length, 3);
        assert.equal(database.changePassQueries.length, 0);

        // (4) The flow should allow people to retry with more secure passwords.
        gunther.respondToDialog({ listitem: 0 /* Change your password */ }).then(
            () => gunther.respondToDialog({ inputtext: 'wrong-pass' })).then(
            () => gunther.respondToDialog({ response: 1 /* Try again */ })).then(
            () => gunther.respondToDialog({ inputtext: 'correct-pass' })).then(
            () => gunther.respondToDialog({ inputtext: 'weak' })).then(
            () => gunther.respondToDialog({ response: 1 /* Try again */ })).then(
            () => gunther.respondToDialog({ inputtext: 'w43k' })).then( 
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));

        assert.equal(database.passwordQueries.length, 4);
        assert.equal(database.changePassQueries.length, 0);

        // (4) The player is able to change their password.
        gunther.respondToDialog({ listitem: 0 /* Change your password */ }).then(
            () => gunther.respondToDialog({ inputtext: 'correct-pass' })).then(
            () => gunther.respondToDialog({ inputtext: 'new-pass' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));

        assert.equal(database.passwordQueries.length, 5);
        assert.equal(database.changePassQueries.length, 1);
        assert.equal(database.changePassQueries[0].nickname, 'Gunther');
    });

    // TODO: Manage aliases

    it('should be able to show the record of a player', async (assert) => {
        gunther.identify({ userId: 42 });

        // (1) An error message is shown when the player's log is clean.
        gunther.respondToDialog({ listitem: 1 /* View your record */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.equal(gunther.lastDialogTitle, 'Account management');

        russell.identify({ userId: 1337 });

        // (2) A dialog with entries is shown when the player's log has entries.
        russell.respondToDialog({ listitem: 1 /* View your record */ }).then(
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
        gunther.respondToDialog({ listitem: 2 /* View your recent sessions */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.equal(gunther.lastDialogTitle, 'Account management');

        russell.identify({ userId: 1337 });

        // (2) A dialog with entries is shown when the player's log has entries.
        russell.respondToDialog({ listitem: 2 /* View your recent sessions */ }).then(
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

    it('should be able to guide on appropriate password strength', async (assert) => {
        assert.isFalse(commands.isSufficientlySecurePassword(''));
        assert.isFalse(commands.isSufficientlySecurePassword('cheese'));
        assert.isFalse(commands.isSufficientlySecurePassword('Cheese'));
        assert.isFalse(commands.isSufficientlySecurePassword('nickname'));
        assert.isTrue(commands.isSufficientlySecurePassword('n1ckname'));
        assert.isTrue(commands.isSufficientlySecurePassword('Nickname'));
    });
});
