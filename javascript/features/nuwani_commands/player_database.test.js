// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MockPlayerDatabase } from 'features/nuwani_commands/test/mock_player_database.js';

describe('PlayerDatabase', it => {
    // Note that while each test instantiates the `MockPlayerDatabase` class, it's actually testing
    // most of the production logic as `MockPlayerDatabase` extends the `PlayerDatabase` changing
    // only the routines that actually interact with the database.

    it('is able to hash and write secure new passwords', async (assert) => {
        const noSaltInstance = new MockPlayerDatabase(/* passwordSalt= */ null);
        try {
            await noSaltInstance.changePassword('foo', 'bar');
            assert.notReached();

        } catch {}

        const instance = new MockPlayerDatabase(/* passwordSalt= */ 's4lt');
        const result = await instance.changePassword('[BB]Ricky92', 'ch4ng3m3');

        assert.isTrue(result);

        assert.equal(instance.changePassQueries.length, 1);
        assert.equal(instance.changePassQueries[0].nickname, '[BB]Ricky92');
        assert.equal(instance.changePassQueries[0].password.length, 40);
        assert.isAboveOrEqual(instance.changePassQueries[0].databaseSalt, 100000000);
        assert.isBelowOrEqual(instance.changePassQueries[0].databaseSalt, 999999999);
    });

    it('is able to generate random database password salts', assert => {
        const instance = new MockPlayerDatabase(/* passwordSalt= */ 's4lt');

        for (let i = 0; i < 500; ++i) {
            const salt = instance.generateDatabaseSalt();

            assert.isAboveOrEqual(salt, 100000000);
            assert.isBelowOrEqual(salt, 999999999);
        }
    });

    // Test custom behaviour: custom_color
    // Test custom behaviour: level
    // Test custom behaviour: money_bank_type
    // Test custom behaviour: last_ip
    // Test custom behaviour: last_seen
});
