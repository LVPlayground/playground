// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerAccountSupplement } from 'features/account_provider/player_account_supplement.js';

describe('PlayerAccountSupplement', it => {
    it('should be uninitialized until identification', assert => {
        const data = new PlayerAccountSupplement();
        assert.isFalse(data.isIdentified());
        assert.isFalse(data.hasRequestedUpdate());

        assert.isNull(data.userId);
        assert.equal(data.bankAccountBalance, 0);
    });

    it('should be able to flag high priority database updates', assert => {
        const data = new PlayerAccountSupplement();
        assert.isFalse(data.hasRequestedUpdate());

        // Normally setters for data properties would be calling this method.
        data.requestUpdate();

        assert.isTrue(data.hasRequestedUpdate());

        // Reading the properties for serialization back to the database will remove the flag.
        data.prepareForDatabase();

        assert.isFalse(data.hasRequestedUpdate());
    });

    it('should be able to translate the `muted` field', async (assert) => {
        const data = new PlayerAccountSupplement();
        assert.isNull(data.mutedUntil);

        data.initializeFromDatabase({ muted: 300 });

        const beforeTimeShiftDatabaseData = data.prepareForDatabase();

        assert.isNotNull(data.mutedUntil);
        assert.closeTo(
            data.mutedUntil, server.clock.monotonicallyIncreasingTime() + 300 * 1000, 1000);
        assert.closeTo(beforeTimeShiftDatabaseData.muted, 300, 5);

        await server.clock.advance(150 * 1000);

        const afterTimeShiftDatabaseData = data.prepareForDatabase();
        assert.closeTo(afterTimeShiftDatabaseData.muted, 150, 5);
        
        await server.clock.advance(150 * 1000);

        const finalDatabaseData = data.prepareForDatabase();
        assert.equal(finalDatabaseData.muted, 0);
    });
});
