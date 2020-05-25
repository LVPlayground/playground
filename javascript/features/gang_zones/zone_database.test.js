// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MockZoneDatabase } from 'features/gang_zones/test/mock_zone_database.js';

describe('ZoneDatabase', it => {
    it('is able to get details about the active gang members on the server', async (assert) => {
        const database = new MockZoneDatabase();

        const members = await database.getActiveMembers();
        assert.isTrue(Array.isArray(members));
        assert.isAboveOrEqual(members.length, 1);

        const activeGangs = new Map();

        // No need to verify the data here, but we can verify data diversity.
        for (const member of members)
            activeGangs.set(member.gangId, (activeGangs.get(member.gangId) || 0) + 1);

        assert.equal(activeGangs.size, 1);
    });

    it('is able to get details about a particular gang on the server', async (assert) => {
        const database = new MockZoneDatabase();

        const allMembers = await database.getActiveMembers();
        const nbMembers = await database.getActiveMembers({ gangId: MockZoneDatabase.NB });

        assert.notEqual(allMembers, nbMembers);
    });

    it('is able to get details about the active gangs on the server', async (assert) => {
        const database = new MockZoneDatabase();

        const members = await database.getActiveMembers();
        const activeGangIds = new Set();

        for (const member of members)
            activeGangIds.add(member.gangId);

        assert.isAboveOrEqual(activeGangIds.size, 1);

        const activeGangs = await database.getActiveGangs(activeGangIds);
        assert.equal(activeGangs.length, activeGangIds.size);
    });

    it('is able to return different mock decorations based on the area', async (assert) => {
        const database = new MockZoneDatabase();

        const allObjects = await database.loadDecorationsForZone({
            gangId: 1,
            area: new Rect(0, 0, 3000, 3000),
        });

        const someObjects = await database.loadDecorationsForZone({
            gangId: 1,
            area: new Rect(0, 1510, 3000, 3000),
        });

        assert.notEqual(allObjects.length, someObjects.length);
    });
});
