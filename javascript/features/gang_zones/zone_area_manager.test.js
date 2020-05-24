// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import Color from 'base/color.js';
import { ZoneAreaManager } from 'features/gang_zones/zone_area_manager.js';
import { ZoneGang } from 'features/gang_zones/structures/zone_gang.js';
import { Zone } from 'features/gang_zones/structures/zone.js';

describe('ZoneAreaManager', (it, beforeEach, afterEach) => {
    // Fake class representing the same interface as ZoneNatives, to mock out what the manager would
    // have done on the SA-MP server to create the gang zones.
    class FakeZoneNatives {
        zoneId_ = 1;
        zones = new Map();
        showForPlayerCalls = 0;

        createZone(area, color) {
            this.zones.set(this.zoneId_, { area, color });
            return this.zoneId_++;
        }
        showZoneForPlayer(player, zoneId, color) {
            this.showForPlayerCalls++;
        }
        deleteZone(zoneId) {
            this.zones.delete(zoneId);
        }
    }

    /**
     * @type ZoneAreaManager
     */
    let manager = null;

    /**
     * @type FakeZoneNatives
     */
    let natives = null;

    beforeEach(() => {
        natives = new FakeZoneNatives();
        manager = new ZoneAreaManager(null, natives);
    });

    afterEach(() => manager.dispose());

    it('should be able to create and delete zones on the server', assert => {
        const zoneGang = new ZoneGang(/* id= */ 9001);
        zoneGang.initialize({ id: 9001, color: null, name: 'BA Hooligans' });

        const zone = new Zone(zoneGang, {
            area: new Rect(40, 50, 150, 150),
        });

        assert.equal(natives.zones.size, 0);

        manager.createZone(zone);
        assert.equal(natives.zones.size, 1);

        for (const createdZone of natives.zones.values()) {
            assert.equal(createdZone.area.minX, 40);
            assert.equal(createdZone.area.minY, 50);
        }

        assert.equal(natives.showForPlayerCalls, 0);
        dispatchEvent('playerspawn', {
            playerid: server.playerManager.getById(/* Gunther= */ 0).id,
        });
        assert.equal(natives.showForPlayerCalls, 1);

        manager.deleteZone(zone);
        assert.equal(natives.zones.size, 0);
    });

    it('should force a configured alpha channel on all gang zones', assert => {
        const zoneGang = new ZoneGang(/* id= */ 9001);
        zoneGang.initialize({ id: 9001, color: Color.fromHex('FFFFFFFF'), name: 'BA Hooligans' });

        const zone = new Zone(zoneGang, {
            area: new Rect(40, 50, 150, 150),
        });

        manager.createZone(zone);
        assert.equal(natives.zones.size, 1);

        for (const createdZone of natives.zones.values())
            assert.notEqual(createdZone.color.a, 255);
    });
});
