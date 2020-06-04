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

        // Give |russell| administrator rights.
        russell.level = Player.LEVEL_ADMINISTRATOR;
    });

    afterEach(() => commands.dispose());

    it('should not work if the player is not registered', async (assert) => {
        assert.isFalse(russell.account.isRegistered());
        assert.isTrue(await russell.issueCommand('/account'));

        assert.equal(russell.messages.length, 1);
        assert.includes(russell.messages[0], 'is not a registered account');
    });

    it('should fail if there are no available options', async (assert) => {
        await russell.identify({ vip: 1 });

        settings.setValue('account/info_visibility', false);
        settings.setValue('account/nickname_control', false);
        settings.setValue('account/password_control', false);
        settings.setValue('account/vip_alias_control', false);
        settings.setValue('account/record_visibility', false);
        settings.setValue('account/session_visibility', false);

        assert.isTrue(await russell.issueCommand('/account'));

        assert.equal(russell.messages.length, 1);
        assert.includes(russell.messages[0], 'options have been disabled');
    });

    it('should hide the appropriate options for regular players', async (assert) => {
        await russell.identify({ vip: 0 });

        russell.respondToDialog({ response: 0 /* Dismiss */ });
        assert.isTrue(await russell.issueCommand('/account'));

        assert.deepEqual(russell.getLastDialogAsTable(/* hasColumns= */ false), [
            'Change your nickname',
            'Change your password',
            'View account information',
            'View player record',
            'View recent sessions',
        ]);
    });

    it('should hide the appropriate options for third party usage', async (assert) => {
        await gunther.identify({ vip: 0 });
        await russell.identify();

        russell.respondToDialog({ response: 0 /* Dismiss */ });
        assert.isTrue(await russell.issueCommand('/account Gunther'));

        assert.deepEqual(russell.getLastDialogAsTable(/* hasColumns= */ false), [
            'View account information',
            'View player record',
            'View recent sessions',
        ]);
    });

    it('should hide the appropriate options for third party usage', async (assert) => {
        await gunther.identify({ vip: 1 });
        await russell.identify();

        russell.respondToDialog({ response: 0 /* Dismiss */ });
        assert.isTrue(await russell.issueCommand('/account Gunther'));

        assert.deepEqual(russell.getLastDialogAsTable(/* hasColumns= */ false), [
            'Manage nickname aliases',
            'View account information',
            'View player record',
            'View recent sessions',
        ]);
    });

    it('should enable players to change their nickname', async (assert) => {
        await gunther.identify({ userId: 42 });

        // (1) The player may only change their name once per X days.
        gunther.respondToDialog({ listitem: 0 /* Change your nickname */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.includes(gunther.lastDialog, 'only been 13 days since you');

        assert.equal(database.passwordQueries.length, 0);
        assert.isNull(database.nameMutation);

        settings.setValue('account/nickname_limit_days', 1);

        // (1a) The player is able to abort the flow to change their nickname.
        gunther.respondToDialog({ listitem: 0 /* Change your nickname */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.includes(gunther.lastDialog, 'your current password');

        assert.equal(database.passwordQueries.length, 0);
        assert.isNull(database.nameMutation);

        // (1b) Abort after verification of their password.
        gunther.respondToDialog({ listitem: 0 /* Change your nickname */ }).then(
            () => gunther.respondToDialog({ inputtext: 'correct-pass' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.includes(gunther.lastDialog, 'the new nickname');
            
        assert.equal(database.passwordQueries.length, 1);
        assert.isNull(database.nameMutation);

        // (2) The flow aborts if the current password cannot be verified.
        gunther.respondToDialog({ listitem: 0 /* Change your nickname */ }).then(
            () => gunther.respondToDialog({ inputtext: 'wrong-pass' })).then(
            () => gunther.respondToDialog({ response: 1 /* Try again */ })).then(
            () => gunther.respondToDialog({ inputtext: 'invalid-pass' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.includes(gunther.lastDialog, 'need to validate');

        assert.equal(database.passwordQueries.length, 3);
        assert.isNull(database.nameMutation);

        // (3) The flow should refuse nicknames that are not valid.
        gunther.respondToDialog({ listitem: 0 /* Change your nickname */ }).then(
            () => gunther.respondToDialog({ inputtext: 'correct-pass' })).then(
            () => gunther.respondToDialog({ inputtext: '^^^MaXiMe^^^' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.includes(gunther.lastDialog, 'a valid SA-MP nickname');

        assert.equal(database.passwordQueries.length, 4);
        assert.isNull(database.nameMutation);

        // (4) The flow should allow people to retry with another nickname.
        gunther.respondToDialog({ listitem: 0 /* Change your password */ }).then(
            () => gunther.respondToDialog({ inputtext: 'wrong-pass' })).then(
            () => gunther.respondToDialog({ response: 1 /* Try again */ })).then(
            () => gunther.respondToDialog({ inputtext: 'correct-pass' })).then(
            () => gunther.respondToDialog({ inputtext: '^^^MaXiMe^^^' })).then(
            () => gunther.respondToDialog({ response: 1 /* Try again */ })).then(
            () => gunther.respondToDialog({ inputtext: 'XD' })).then( 
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.includes(gunther.lastDialog, 'a valid SA-MP nickname');

        assert.equal(database.passwordQueries.length, 6);
        assert.isNull(database.nameMutation);

        // (5) The flow should reject nicknames that are already in use.
        gunther.respondToDialog({ listitem: 0 /* Change your nickname */ }).then(
            () => gunther.respondToDialog({ inputtext: 'correct-pass' })).then(
            () => gunther.respondToDialog({ inputtext: '[BB]Joe' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.includes(gunther.lastDialog, 'be available on');

        assert.equal(database.passwordQueries.length, 7);
        assert.isNull(database.nameMutation);

        // (6) The flow should enable players to change their nickname.
        gunther.respondToDialog({ listitem: 0 /* Change your nickname */ }).then(
            () => gunther.respondToDialog({ inputtext: 'correct-pass' })).then(
            () => gunther.respondToDialog({ inputtext: 'NewNick' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.includes(gunther.lastDialog, 'has been changed');

        assert.equal(database.passwordQueries.length, 8);
        assert.isNotNull(database.nameMutation);

        // (7) Verify that |gunther|'s nickname has been updated.
        assert.equal(gunther.name, 'NewNick');

        // (8) Verify that administrators have received a message.
        assert.equal(russell.messages.length, 1);
        assert.includes(
            russell.messages[0],
            Message.format(Message.ACCOUNT_ADMIN_NICKNAME_CHANGED, 'Gunther', gunther.id,
                           gunther.name));
    });

    it('should enable players to change their password', async (assert) => {
        assert.isTrue(database.canUpdatePasswords());
        
        await gunther.identify({ userId: 42 });

        // (1a) The player is able to abort the flow to change their password.
        gunther.respondToDialog({ listitem: 1 /* Change your password */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));

        assert.equal(database.passwordQueries.length, 0);
        assert.equal(database.changePassQueries.length, 0);

        // (1b) Abort after verification of their current password.
        gunther.respondToDialog({ listitem: 1 /* Change your password */ }).then(
            () => gunther.respondToDialog({ inputtext: 'correct-pass' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
            
        assert.equal(database.passwordQueries.length, 1);
        assert.equal(database.changePassQueries.length, 0);

        // (2) The flow aborts if the current password cannot be verified.
        gunther.respondToDialog({ listitem: 1 /* Change your password */ }).then(
            () => gunther.respondToDialog({ inputtext: 'wrong-pass' })).then(
            () => gunther.respondToDialog({ response: 1 /* Try again */ })).then(
            () => gunther.respondToDialog({ inputtext: 'invalid-pass' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));

        assert.equal(database.passwordQueries.length, 3);
        assert.equal(database.changePassQueries.length, 0);

        // (3) The flow should refuse password that are not strong enough.
        gunther.respondToDialog({ listitem: 1 /* Change your password */ }).then(
            () => gunther.respondToDialog({ inputtext: 'correct-pass' })).then(
            () => gunther.respondToDialog({ inputtext: 'weak' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));

        assert.equal(database.passwordQueries.length, 4);
        assert.equal(database.changePassQueries.length, 0);

        // (4) The flow should allow people to retry with more secure passwords.
        gunther.respondToDialog({ listitem: 1 /* Change your password */ }).then(
            () => gunther.respondToDialog({ inputtext: 'wrong-pass' })).then(
            () => gunther.respondToDialog({ response: 1 /* Try again */ })).then(
            () => gunther.respondToDialog({ inputtext: 'correct-pass' })).then(
            () => gunther.respondToDialog({ inputtext: 'weak' })).then(
            () => gunther.respondToDialog({ response: 1 /* Try again */ })).then(
            () => gunther.respondToDialog({ inputtext: 'w43k' })).then( 
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));

        assert.equal(database.passwordQueries.length, 6);
        assert.equal(database.changePassQueries.length, 0);

        // (5) The user needs to confirm the password they want to change theirs to.
        gunther.respondToDialog({ listitem: 1 /* Change your password */ }).then(
            () => gunther.respondToDialog({ inputtext: 'correct-pass' })).then(
            () => gunther.respondToDialog({ inputtext: 'new-pass' })).then(
            () => gunther.respondToDialog({ inputtext: 'new-pazz' })).then(  // <-- typo!
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));

        assert.equal(database.passwordQueries.length, 7);
        assert.equal(database.changePassQueries.length, 0);

        assert.includes(gunther.lastDialog, 'enter exactly the same password again');

        // (4) The player is able to change their password.
        gunther.respondToDialog({ listitem: 1 /* Change your password */ }).then(
            () => gunther.respondToDialog({ inputtext: 'correct-pass' })).then(
            () => gunther.respondToDialog({ inputtext: 'new-pass' })).then(
            () => gunther.respondToDialog({ inputtext: 'new-pass' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));

        assert.equal(database.passwordQueries.length, 8);
        assert.equal(database.changePassQueries.length, 1);
        assert.equal(database.changePassQueries[0].nickname, 'Gunther');

        // (5) Verify that administrators have received a message.
        assert.equal(russell.messages.length, 1);
        assert.includes(
            russell.messages[0],
            Message.format(Message.ACCOUNT_ADMIN_PASSWORD_CHANGED, 'Gunther', gunther.id));
    });

    it('should enable VIPs to see a list of their aliases', async (assert) => {
        await gunther.identify({ userId: 42, vip: 1 });

        gunther.respondToDialog({ listitem: 2 /* Manage nickname aliases */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.deepEqual(gunther.getLastDialogAsTable().rows, [
            [ 'Create a new alias',  '-' ],
            [ '-----',               '-----' ],
            [ 'WoodPecker',          'May 1, 2020' ],
            [ '[BA]Ro[BB]in',        'June 9, 2018' ],
        ]);
    });

    it('should enable VIPs to create an alias', async (assert) => {
        await gunther.identify({ userId: 42, vip: 1 });

        settings.setValue('account/vip_alias_limit_player', 3);

        // (1) Alias frequency limit for players.
        gunther.respondToDialog({ listitem: 2 /* Manage nickname aliases */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Create a new alias */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.equal(gunther.lastDialogTitle, 'Alias management');
        assert.includes(gunther.lastDialog, 'only been 4 days');
        assert.isNull(database.aliasMutation);

        await russell.identify({ userId: 42, vip: 1 });

        // (2) No alias frequency limit for administrators.
        russell.respondToDialog({ listitem: 2 /* Manage nickname aliases */ }).then(
            () => russell.respondToDialog({ listitem: 0 /* Create a new alias */ })).then(
            () => russell.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await russell.issueCommand('/account'));
        assert.equal(russell.lastDialogTitle, 'Alias management');
        assert.doesNotInclude(russell.lastDialog, 'only been 4 days');
        assert.isNull(database.aliasMutation);

        settings.setValue('account/vip_alias_limit_days', 0);

        // (3) New alias must be a valid nickname.
        gunther.respondToDialog({ listitem: 2 /* Manage nickname aliases */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Create a new alias */ })).then(
            () => gunther.respondToDialog({ inputtext: '^^^MaXiMe^^^'})).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.equal(gunther.lastDialogTitle, 'Alias management');
        assert.includes(gunther.lastDialog, 'a valid SA-MP nickname');
        assert.isNull(database.aliasMutation);

        // (4) New alias must not be in-use on the server.
        gunther.respondToDialog({ listitem: 2 /* Manage nickname aliases */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Create a new alias */ })).then(
            () => gunther.respondToDialog({ inputtext: 'Russell'})).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.equal(gunther.lastDialogTitle, 'Alias management');
        assert.includes(gunther.lastDialog, 'be available');
        assert.isNull(database.aliasMutation);
        
        // (5) New alias must not be registered with Las Venturas Playground.
        gunther.respondToDialog({ listitem: 2 /* Manage nickname aliases */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Create a new alias */ })).then(
            () => gunther.respondToDialog({ inputtext: 'WoodPecker'})).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.equal(gunther.lastDialogTitle, 'Alias management');
        assert.includes(gunther.lastDialog, 'be available on Las Venturas Playground');
        assert.isNull(database.aliasMutation);

        // (6) Creating a new alias works fine.
        gunther.respondToDialog({ listitem: 2 /* Manage nickname aliases */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Create a new alias */ })).then(
            () => gunther.respondToDialog({ inputtext: 'NewNick'})).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.equal(gunther.lastDialogTitle, 'Alias management');
        assert.includes(gunther.lastDialog, 'The alias NewNick has been created.');

        assert.isNotNull(database.aliasMutation);
        assert.equal(database.aliasMutation.userId, 4050);
        assert.equal(database.aliasMutation.alias, 'NewNick');

        // (7) Verify administrator notices.
        assert.equal(russell.messages.length, 1);
        assert.includes(
            russell.messages[0],
            Message.format(Message.ACCOUNT_ADMIN_ALIAS_CREATED, gunther.name, gunther.id,
                           'NewNick'));

        settings.setValue('account/vip_alias_limit_player', 2);

        // (8) Alias count limit for players.
        gunther.respondToDialog({ listitem: 2 /* Manage nickname aliases */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Create a new alias */ })).then(
            () => gunther.respondToDialog({ inputtext: 'NewNick'})).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.equal(gunther.lastDialogTitle, 'Alias management');
        assert.includes(gunther.lastDialog, 'only allowed 2 aliases');
    });

    it('should enable VIPs to delete an alias', async (assert) => {
        await gunther.identify({ userId: 42, vip: 1 });

        // (1) Aliases created less than |vip_alias_limit_days| days ago cannot be deleted.
        gunther.respondToDialog({ listitem: 2 /* Manage nickname aliases */ }).then(
            () => gunther.respondToDialog({ listitem: 2 /* WoodPecker */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.equal(gunther.lastDialogTitle, 'Alias management');
        assert.includes(gunther.lastDialog, 'only been 4 days since');
        assert.isNull(database.aliasMutation);

        settings.setValue('account/vip_alias_limit_days', 0);

        // (2) They can abort deletion of an alias.
        gunther.respondToDialog({ listitem: 2 /* Manage nickname aliases */ }).then(
            () => gunther.respondToDialog({ listitem: 2 /* WoodPecker */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.equal(gunther.lastDialogTitle, 'Alias management');
        assert.includes(gunther.lastDialog, 'Are you sure');
        assert.isNull(database.aliasMutation);

        // (3) Aliases can be successfully deleted.
        gunther.respondToDialog({ listitem: 2 /* Manage nickname aliases */ }).then(
            () => gunther.respondToDialog({ listitem: 2 /* WoodPecker */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Confirm */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.equal(gunther.lastDialogTitle, 'Alias management');
        assert.includes(gunther.lastDialog, 'WoodPecker has been deleted');

        assert.isNotNull(database.aliasMutation);
        assert.equal(database.aliasMutation.userId, 4050);
        assert.equal(database.aliasMutation.alias, 'WoodPecker');

        // (4) Verify administrator notices.
        assert.equal(russell.messages.length, 1);
        assert.includes(
            russell.messages[0],
            Message.format(Message.ACCOUNT_ADMIN_ALIAS_DELETED, gunther.name, gunther.id,
                           'WoodPecker'));
    });

    it('should be able to show information about an account', async (assert) => {
        await russell.identify({ userId: 42, vip: 1 });

        russell.respondToDialog({ listitem: 3 /* View account information */ }).then(
            () => russell.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await russell.issueCommand('/account'));
        assert.equal(russell.lastDialogTitle, 'Account information of Russell');

        const result = russell.getLastDialogAsTable();
        assert.equal(result.rows.length, 10);
        assert.deepEqual(result.rows, [
            [
                'Username',
                'Russell',
            ],
            [
                'E-mail',
                'info@sa-mp.nl',
            ],
            [
                'Registered',
                'May 4, 2016 at 12:14 PM',
            ],
            [
                'Level',
                'Management',
            ],
            [
                'Karma',
                '23,457',
            ],
            [
                '----------',
                '----------',
            ],
            [
                'VIP',
                'Yes',
            ],
            [
                'Donations',
                '1,235 euro',
            ],
            [
                '----------',
                '----------',
            ],
            [
                'Sessions',
                '24',
            ],
        ]);
    });

    it('should be able to show the record of a player', async (assert) => {
        await gunther.identify({ userId: 42, vip: 1 });

        // (1) An error message is shown when the player's log is clean.
        gunther.respondToDialog({ listitem: 4 /* View your record */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.equal(gunther.lastDialogTitle, 'Account management');

        await russell.identify({ userId: 1337, vip: 1 });

        // (2) A dialog with entries is shown when the player's log has entries.
        russell.respondToDialog({ listitem: 4 /* View your record */ }).then(
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

    it('should change /register depending on whether beta features are enabled', async (assert) => {
        settings.setValue('playground/enable_beta_features', false);

        russell.respondToDialog({ response: 0 /* Dismiss */ });

        assert.isTrue(await russell.issueCommand('/register'));
        assert.equal(russell.lastDialogTitle, 'Las Venturas Playground');
        assert.equal(russell.messages.length, 0);

        // Now enable beta features, which will change /register to actually create accounts.
        settings.setValue('playground/enable_beta_features', true);

        gunther.respondToDialog({ inputtext: '1234' /* insecure */ }).then(
            () => gunther.respondToDialog({ response: 1 /* Confirm */ })).then(
            () => gunther.respondToDialog({ inputtext: 'Se$urePazz' })).then(
            () => gunther.respondToDialog({ inputtext: 'Se444ePazz' /* not repeated */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Acknowledge */ })).then(
            () => gunther.respondToDialog({ inputtext: 'Se$urePazz' })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));
        
        assert.isTrue(await gunther.issueCommand('/register'));

        assert.equal(russell.messages.length, 1);
        assert.includes(
            russell.messages[0],
            Message.format(Message.ACCOUNT_ADMIN_CREATED, gunther.name, gunther.id));
    });

    it('should enable players on the beta server to change their account', async (assert) => {
        settings.setValue('playground/enable_beta_features', true);

        gunther.name = 'Ricky92';  // Gunther has special behaviour

        await gunther.identify({ userId: 42, vip: 1 });      
        await russell.identify({ userId: 42, vip: 1 });  

        // (1) Enable Gunther to change themselves to become an administrator.
        gunther.respondToDialog({ listitem: 6 /* Manage account info */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* Change level */ })).then(
            () => gunther.respondToDialog({ listitem: 1 /* Administrator */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Acknowledge */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.includes(gunther.lastDialog, 'level has been changed');
        assert.isTrue(gunther.isConnected());

        await server.clock.advance(1000);

        assert.isFalse(gunther.isConnected());

        // (2) Enable Russell to revoke their own VIP rights.
        russell.respondToDialog({ listitem: 6 /* Manage account info */ }).then(
            () => russell.respondToDialog({ listitem: 1 /* Change VIP */ })).then(
            () => russell.respondToDialog({ listitem: 0 /* Regular Player */ })).then(
            () => russell.respondToDialog({ response: 0 /* Acknowledge */ }));

        assert.isTrue(await russell.issueCommand('/account'));
        assert.includes(russell.lastDialog, 'VIP status has been changed');
        assert.isTrue(russell.isConnected());

        await server.clock.advance(1000);

        assert.isFalse(russell.isConnected());
    });

    it('should be able to display the recent sessions of a player', async (assert) => {
        await gunther.identify({ userId: 42, vip: 1 });

        // (1) An error message is shown when the player's log is clean.
        gunther.respondToDialog({ listitem: 5 /* View your recent sessions */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        assert.isTrue(await gunther.issueCommand('/account'));
        assert.equal(gunther.lastDialogTitle, 'Account management');

        await russell.identify({ userId: 1337, vip: 1 });

        // (2) A dialog with entries is shown when the player's log has entries.
        russell.respondToDialog({ listitem: 5 /* View your recent sessions */ }).then(
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
