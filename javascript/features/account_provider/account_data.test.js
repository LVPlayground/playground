// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AccountData } from 'features/account_provider/account_data.js';

describe('AccountData', it => {
    it('should be uninitialized until identification', assert => {
        const data = new AccountData();
        assert.isFalse(data.hasIdentified());
        assert.isFalse(data.hasRequestedUpdate());

        assert.isUndefined(data.userId);
        assert.isUndefined(data.bankAccountBalance);
    });

    it('should be able to flag high priority database updates', assert => {
        const data = new AccountData();
        assert.isFalse(data.hasRequestedUpdate());

        // Normally setters for data properties would be calling this method.
        data.requestUpdate();

        assert.isTrue(data.hasRequestedUpdate());

        // Reading the properties for serialization back to the database will remove the flag.
        data.prepareForDatabase();

        assert.isFalse(data.hasRequestedUpdate());
    });
});
