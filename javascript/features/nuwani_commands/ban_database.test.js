// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { BanDatabase } from 'features/nuwani_commands/ban_database.js';
import { MockBanDatabase } from 'features/nuwani_commands/test/mock_ban_database.js';

describe('PlayerDatabase', it => {
    // Note that while each test instantiates the `MockBanDatabase` class, it's actually testing
    // most of the production logic as `MockBanDatabase` extends the `BanDatabase` changing only the
    // routines that actually interact with the database.

    it('is able to add notes the the database', async (assert) => {
        const instance = new MockBanDatabase();

        assert.isTrue(await instance.addEntry({
            type: BanDatabase.kTypeNote,
            sourceNickname: '[BB]Ricky92',
            subjectNickname: '[HC]Golk3r',
            note: 'Good chap!'
        }));

        assert.isNotNull(instance.addedEntry);
        assert.equal(instance.addedEntry.type, BanDatabase.kTypeNote);
        assert.equal(instance.addedEntry.banIpRangeStart, 0);
        assert.equal(instance.addedEntry.banIpRangeEnd, 0);
        assert.equal(instance.addedEntry.banSerial, 0);
        assert.equal(instance.addedEntry.banDurationDays, 0);
        assert.equal(instance.addedEntry.sourceUserId, 0);
        assert.equal(instance.addedEntry.sourceNickname, '[BB]Ricky92');
        assert.equal(instance.addedEntry.subjectUserId, 0);
        assert.equal(instance.addedEntry.subjectNickname, '[HC]Golk3r');
        assert.equal(instance.addedEntry.note, 'Good chap!');

        assert.isTrue(await instance.addEntry({
            type: BanDatabase.kTypeNote,
            sourceUserId: 4050,
            sourceNickname: 'Beaner',
            subjectUserId: 1337,
            subjectNickname: '[HC]Golk3r',
            note: 'Seems to be fighting a lot?'
        }));

        assert.isNotNull(instance.addedEntry);
        assert.equal(instance.addedEntry.sourceUserId, 4050);
        assert.equal(instance.addedEntry.sourceNickname, 'Beaner');
        assert.equal(instance.addedEntry.subjectUserId, 1337);
        assert.equal(instance.addedEntry.subjectNickname, '[HC]Golk3r');
        assert.equal(instance.addedEntry.note, 'Seems to be fighting a lot?');
    });
});

