// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MockAccountDatabase } from 'features/account/test/mock_account_database.js';

describe('AccountDatabase', it => {
    // Note that while each test instantiates the `MockAccountDatabase` class, it's actually testing
    // most of the production logic as `MockAccountDatabase` extends the `AccountDatabase` changing
    // only the routines that actually interact with the database.

    it('is able to hash and write secure new passwords', async (assert) => {
        const noSaltInstance = new MockAccountDatabase();
        try {
            await noSaltInstance.changePassword('foo', 'bar');
            assert.notReached();

        } catch {}

        const instance = new MockAccountDatabase();
        instance.setPasswordSalt('s4lt');

        const result = await instance.changePassword('[BB]Ricky92', 'ch4ng3m3');

        assert.isTrue(result);

        assert.equal(instance.changePassQueries.length, 1);
        assert.equal(instance.changePassQueries[0].nickname, '[BB]Ricky92');
        assert.equal(instance.changePassQueries[0].password.length, 40);
        assert.isAboveOrEqual(instance.changePassQueries[0].databaseSalt, 100000000);
        assert.isBelowOrEqual(instance.changePassQueries[0].databaseSalt, 999999999);
    });

    it('is able to generate random database password salts', assert => {
        const instance = new MockAccountDatabase();

        for (let i = 0; i < 500; ++i) {
            const salt = instance.generateDatabaseSalt();

            assert.isAboveOrEqual(salt, 100000000);
            assert.isBelowOrEqual(salt, 999999999);
        }
    });

    it('is able to get entries from the player log', async (assert) => {
        const instance = new MockAccountDatabase();

        const noResults = await instance.getPlayerRecord(/* userId= */ 42);
        assert.equal(noResults.length, 0);

        const results = await instance.getPlayerRecord(/* userId= */ 1337);
        assert.equal(results.length, 2);
        
        assert.isTrue(results[0].date instanceof Date);
        assert.equal(results[0].type, 'kick');
        assert.equal(results[0].issuedBy, 'Joe');
        assert.equal(results[0].issuedTo, '[BB]GoodJoe');
        assert.equal(results[0].reason, 'Being too kind');

        assert.isTrue(results[1].date instanceof Date);
        assert.equal(results[1].type, 'ban');
        assert.equal(results[1].issuedBy, 'slein');
        assert.equal(results[1].issuedTo, '[BB]GoodJoe');
        assert.equal(results[1].reason, '3 day ban for cbug abuse');
    });

    it('is able to get the most recent sessions for a player', async (assert) => {
        const instance = new MockAccountDatabase();

        const noResults = await instance.getPlayerSessions({ userId: 42 });
        assert.equal(noResults.length, 0);

        const results = await instance.getPlayerSessions({ userId: 1337 });
        assert.equal(results.length, 3);
        
        assert.isTrue(results[0].date instanceof Date);
        assert.equal(results[0].duration, 3625);
        assert.equal(results[0].nickname, '[BB]GoodJoe');
        assert.equal(results[0].ip, '37.48.87.211');
    });

    it('is able to verify a nickname/password combination', async (assert) => {
        const instance = new MockAccountDatabase();
        instance.setPasswordSalt('s4lt$');

        assert.isFalse(await instance.validatePassword('InvalidUser', 'passzw0rd'));
        assert.isTrue(await instance.validatePassword('Joe', 'correct-pass'));
        assert.isFalse(await instance.validatePassword('Joe', 'I-AM-A-HERO'));

        instance.setPasswordSalt('Blaat');

        assert.isFalse(await instance.validatePassword('Joe', 'correct-pass'));
    });

    it('is able to validate numeric values when updating player data', async (assert) => {
        const instance = new MockAccountDatabase();

        try {
            await instance.updatePlayerField('nickname', 'kill_count', -9999999999);
            assert.notReached();

        } catch {}

        try {
            await instance.updatePlayerField('nickname', 'kill_count', 9999999999);
            assert.notReached();

        } catch {}

        const result = await instance.updatePlayerField('nickname', 'kill_count', '28347');
        assert.isTrue(typeof result === 'number');
        assert.strictEqual(result, 28347);
    });

    it('is able to validate string values when updating player data', async (assert) => {
        const instance = new MockAccountDatabase();

        try {
            await instance.updatePlayerField('nickname', 'death_message', 'a'.repeat(500));
            assert.notReached();

        } catch {}

        const result = await instance.updatePlayerField('nickname', 'death_message', 'Kaboom!');
        assert.isTrue(typeof result === 'string');
        assert.strictEqual(result, 'Kaboom!');
    });

    it('should be able to format and update colours', async (assert) => {
        const instance = new MockAccountDatabase();

        const value = await instance.getPlayerField('[BB]Ricky92', 'custom_color');
        assert.isTrue(typeof value === 'string');
        assert.equal(value, '#8952EB');

        const invalidValues = ['red', '#FF', '#FFFF', 'FFFFFF', '#FFFFFFFF', 15653933];
        for (const invalidValue of invalidValues) {
            try {
                await instance.updatePlayerField('nickname', 'custom_color', invalidValue);
                assert.notReached();
    
            } catch (exception) {
                assert.includes(exception.message, 'not a valid color');
            }
        }

        const result = await instance.updatePlayerField('nickname', 'custom_color', '#FF00FF');
        assert.isTrue(typeof result === 'string');
        assert.strictEqual(result, '#FF00FF');

        assert.isTrue(typeof instance.updatedValue === 'number');
        assert.equal(instance.updatedValue, -16711766);
    });

    it('should be able to format and update player levels', async (assert) => {
        const instance = new MockAccountDatabase();

        const value = await instance.getPlayerField('[BB]Ricky92', 'level');
        assert.isTrue(typeof value === 'string');
        assert.equal(value, 'Management');

        const invalidValues = ['admin', 'mod', 'Moderator', 'management'];
        for (const invalidValue of invalidValues) {
            try {
                await instance.updatePlayerField('nickname', 'level', invalidValue);
                assert.notReached();
    
            } catch (exception) {
                assert.includes(exception.message, 'not a valid player level');
            }
        }

        const result = await instance.updatePlayerField('nickname', 'level', 'Player');
        assert.isTrue(typeof result === 'string');
        assert.strictEqual(result, 'Player');

        assert.isTrue(typeof instance.updatedValue === 'string');
        assert.equal(instance.updatedValue, 'Player');
    });

    it('should be able to format and update last seen IP addresses', async (assert) => {
        const instance = new MockAccountDatabase();

        const value = await instance.getPlayerField('[BB]Ricky92', 'last_ip');
        assert.isTrue(typeof value === 'string');
        assert.equal(value, '37.48.87.211');

        const result = await instance.updatePlayerField('[BB]Ricky92', 'last_ip', '127.0.0.1');
        assert.isTrue(typeof result === 'string');
        assert.equal(result, '127.0.0.1');

        assert.isTrue(typeof instance.updatedValue === 'number');
        assert.equal(instance.updatedValue, 2130706433);
    });

    it('should be able to format and update last seen times', async (assert) => {
        const instance = new MockAccountDatabase();

        const value = await instance.getPlayerField('[BB]Ricky92', 'last_seen');
        assert.isTrue(typeof value === 'string');
        assert.equal(value, '2019-12-24 12:44:41');

        const invalidValues = ['bakery', 'yesterday', '???'];
        for (const invalidValue of invalidValues) {
            try {
                await instance.updatePlayerField('nickname', 'last_seen', invalidValue);
                assert.notReached();
    
            } catch (exception) {
                assert.includes(exception.message, 'not a valid date format');
            }
        }

        const outOfRangeValues = ['2041-12-01 12:41:00', '2001-01-01 05:24:12'];
        for (const outOfRangeValue of outOfRangeValues) {
            try {
                await instance.updatePlayerField('nickname', 'last_seen', outOfRangeValue);
                assert.notReached();
    
            } catch (exception) {
                assert.includes(exception.message, 'between 2006 and right now');
            }
        }

        const result = await instance.updatePlayerField(
            '[BB]Ricky92', 'last_seen', '2020-04-26 20:27:12');

        assert.isTrue(typeof result === 'string');
        assert.equal(result, '2020-04-26 20:27:12');

        assert.isTrue(typeof instance.updatedValue === 'string');
        assert.equal(instance.updatedValue, '2020-04-26 20:27:12');
    });

    it('should allow for adding aliases to a user account', async (assert) => {
        const instance = new MockAccountDatabase();

        try {
            await instance.addAlias('[BB]Ricky92', '^^Rickster^^');
            assert.notReached();
        } catch (exception) {
            assert.includes(exception.message, 'not a valid SA-MP nickname');
        }

        try {
            await instance.addAlias('FakeUser', 'AliasName');
            assert.notReached();
        } catch (exception) {
            assert.includes(exception.message, 'could not be found');
        }

        try {
            await instance.addAlias('WoodPecker', 'AliasName');
            assert.notReached();
        } catch (exception) {
            assert.includes(exception.message, 'is an alias by itself');
        }

        try {
            await instance.addAlias('[BB]Ricky92', '[BA]Ro[BB]in');
            assert.notReached();
        } catch (exception) {
            assert.includes(exception.message, 'already is a player');
        }

        assert.isTrue(await instance.addAlias('[BB]Ricky92', 'AliasName'));

        assert.isNotNull(instance.aliasMutation);
        assert.equal(instance.aliasMutation.userId, 4050);
        assert.equal(instance.aliasMutation.alias, 'AliasName');
    });

    it('should allow for removing aliases from a user account', async (assert) => {
        const instance = new MockAccountDatabase();

        try {
            await instance.removeAlias('FakeUser', 'AliasName');
            assert.notReached();
        } catch (exception) {
            assert.includes(exception.message, 'could not be found');
        }

        try {
            await instance.removeAlias('WoodPecker', 'AliasName');
            assert.notReached();
        } catch (exception) {
            assert.includes(exception.message, 'is an alias by itself');
        }

        try {
            await instance.removeAlias('[BB]Ricky92', 'AliasName');
            assert.notReached();
        } catch (exception) {
            assert.includes(exception.message, 'is not an alias');
        }

        assert.isTrue(await instance.removeAlias('[BB]Ricky92', 'WoodPecker'));

        assert.isNotNull(instance.aliasMutation);
        assert.equal(instance.aliasMutation.userId, 4050);
        assert.equal(instance.aliasMutation.alias, 'WoodPecker');
    });

    it('should be able to safely change the nickname of a user', async (assert) => {
        const instance = new MockAccountDatabase();

        try {
            await instance.changeName('[BB]Ricky92', '^^Rickster^^');
            assert.notReached();
        } catch (exception) {
            assert.includes(exception.message, 'not a valid SA-MP nickname');
        }

        try {
            await instance.changeName('FakeUser', 'NewNick');
            assert.notReached();
        } catch (exception) {
            assert.includes(exception.message, 'could not be found');
        }

        try {
            await instance.changeName('WoodPecker', 'NewNick');
            assert.notReached();
        } catch (exception) {
            assert.includes(exception.message, 'is an alias');
        }

        try {
            await instance.changeName('[BB]Ricky92', '[BA]Ro[BB]in');
            assert.notReached();
        } catch (exception) {
            assert.includes(exception.message, 'already is a player');
        }

        assert.isTrue(await instance.changeName('[BB]Ricky92', 'NewNick'));

        assert.isNotNull(instance.nameMutation);
        assert.equal(instance.nameMutation.userId, 4050);
        assert.equal(instance.nameMutation.nickname, '[BB]Ricky92');
        assert.equal(instance.nameMutation.newNickname, 'NewNick');
    });

    it('should only list valid admin-changeable fields for !getvalue & co.', assert => {
        const instance = new MockAccountDatabase();

        const administratorFields = instance.getSupportedFieldsForAdministrators();
        const fields = instance.getSupportedFields();

        // If this check fails, one of the fields returned from getSupportedFieldsForAdministrators
        // is not a valid, supported database field anymore. Make sure it's aligned.
        for (const fieldName of administratorFields)
            assert.isTrue(fieldName in fields);
    });
});
