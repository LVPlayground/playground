// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import GangZones from 'features/gang_zones/gang_zones.js';
import { MockZoneDatabase } from 'features/gang_zones/test/mock_zone_database.js';
import { Player } from 'entities/player.js';
import { Vector } from 'base/vector.js';

import createHousesTestEnvironment from 'features/houses/test/test_environment.js';

describe('ZoneCommands', (it, beforeEach) => {
    let commands = null;
    let manager = null;
    let russell = null;

    beforeEach(async() => {
        await createHousesTestEnvironment();

        // Register the |gang_zones| feature since it's not being loaded by default.
        server.featureManager.registerFeaturesForTests({
            gang_zones: GangZones,
        });

        const feature = server.featureManager.loadFeature('gang_zones');
        const houses = server.featureManager.loadFeature('houses');
        const playground = server.featureManager.loadFeature('playground');

        await MockZoneDatabase.populateTestHouses(houses);

        commands = feature.commands_;
        manager = feature.manager_;

        russell = server.playerManager.getById(/* Russell= */ 1);
        await russell.identify();

        // Change the |zone| command's access requirements so that everyone can use it.
        playground.access.setCommandLevel('zone', Player.LEVEL_PLAYER);
    });

    // List index of the menu option to purchase new decorations.
    const kPurchaseDecorationIndex = 0;

    // Function to position the given |player| in the center of the first created gang zone. The
    // Zone object that represents this zone will be returned as well.
    function positionPlayerForFirstGangZone(player) {
        const zones = Array.from(manager.areaManager_.zones_.keys());
        if (!zones.length)
            throw new Error('No gang zones could be found on the server.');

        const zone = zones[0];
        const [ x, y ] = zone.area.center;

        // Position the |player| to the center of the zone.
        player.position = new Vector(x, y, 10);

        // Trigger the callback that would've let the system know that the player entered the zone.
        manager.onPlayerEnterZone(player, zone);

        return zone;
    }

    // Returns the first scoped object that's owned by the |commands|.
    function getFirstScopedObject() {
        const entities = commands.entities_;
        if (entities.objects_.size !== 1)
            throw new Error(`Expected 1 object to be created, got ${entities.objects_.size}.`);
        
        return [...entities.objects_][0];
    }

    // Executes microtasks in a loop until the server's object count has changed.
    async function runUntilObjectCountChanged() {
        const initialObjectCount = server.objectManager.count;
        while (server.objectManager.count === initialObjectCount)
            await Promise.resolve();
    }

    it('should not allow players to use the command unless they are in a zone', async (assert) => {
        // (1) Players should receive an error message when using the command outside a zone.
        assert.isNull(manager.getZoneForPlayer(russell));

        assert.isTrue(await russell.issueCommand('/zone'));
        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], Message.format(Message.ZONE_NOT_IN_ZONE));

        const zone = positionPlayerForFirstGangZone(russell);

        // (2) Even when in a non-owned zone, players just get an error message straight away.
        assert.isNotNull(manager.getZoneForPlayer(russell));

        assert.isTrue(await russell.issueCommand('/zone'));
        assert.equal(russell.messages.length, 3);  // +entered announcement
        assert.equal(
            russell.messages[2], Message.format(Message.ZONE_NOT_IN_OWNED_ZONE, zone.gangName));

        russell.level = Player.LEVEL_ADMINISTRATOR;

        // (3) Administrators have to confirm they want to modify a non-owned zone.
        russell.respondToDialog({ response: 1 /* Confirm interference */ }).then(message => {
            assert.includes(message, 'should not interfere with their business');
            return russell.respondToDialog({ response: 0 /* Dismiss */});
        });

        assert.isTrue(await russell.issueCommand('/zone'));
    });

    it('should enable players to purchase new decorations for their zone', async (assert) => {
        const zone = positionPlayerForFirstGangZone(russell);
        russell.gangId = zone.gangId;  // make |russell| part of the owning gang

        // (1) Verify that categories with objects can be found.
        russell.respondToDialog({ listitem: kPurchaseDecorationIndex }).then(
            () => russell.respondToDialog({ response: 0 /* Dismiss */}));

        assert.isTrue(await russell.issueCommand('/zone'));
        assert.isAbove(russell.getLastDialogAsTable(/* hasColumn= */ true).rows.length, 0);

        // (2) Verify that objects can be found.
        russell.respondToDialog({ listitem: kPurchaseDecorationIndex }).then(
            () => russell.respondToDialog({ listitem: 0 /* First category */ })).then(
            () => russell.respondToDialog({ response: 0 /* Dismiss */}));

        assert.isTrue(await russell.issueCommand('/zone'));
        assert.isAbove(russell.getLastDialogAsTable(/* hasColumn= */ true).rows.length, 0);

        // (3) Verify that the object will actually be positioned within the zone.
        russell.respondToDialog({ listitem: kPurchaseDecorationIndex }).then(
            () => russell.respondToDialog({ listitem: 0 /* First category */ })).then(
            () => russell.respondToDialog({ listitem: 0 /* First object */ })).then(
            () => russell.respondToDialog({ response: 0 /* Cancel */ }));

        const commandPromise = russell.issueCommand('/zone');
        await runUntilObjectCountChanged();

        const object = getFirstScopedObject();
        assert.isNotNull(object);

        server.objectManager.onObjectEdited({
            objectid: object.id,
            playerid: russell.id,
            response: 1,  // EDIT_RESPONSE_FINAL
            x: zone.area.minX - 1,
            y: zone.area.minY + 1,
            z: 10,
            rx: 0,
            ry: 0,
            rz: 0,
        });

        await runUntilObjectCountChanged();

        assert.includes(russell.lastDialog, 'The object must be located within the zone.');
        assert.isFalse(object.isConnected());

        await commandPromise;
    });

    it('should enable management members to clear caches', async (assert) => {
        russell.level = Player.LEVEL_MANAGEMENT;

        assert.isTrue(await russell.issueCommand('/zone reload'));
        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0], Message.format(Message.ZONE_RELOADED));
    });

    it('should be able to run tests with all data initialized', async (assert) => {
        assert.equal(manager.areaManager_.zones_.size, 3);
    });
});
