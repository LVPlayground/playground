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
    let gangs = null;
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

        await MockZoneDatabase.populateTestHouses(houses);

        commands = feature.commands_;
        gangs = server.featureManager.loadFeature('gangs');
        manager = feature.manager_;

        russell = server.playerManager.getById(/* Russell= */ 1);
        await russell.identify();

        // Create a fake gang entry for |russell| to deal with the financial side of things.
        const gang = Object.assign({}, { balance: 0, members: [ russell ] });

        gangs.manager_.gangPlayers_.set(russell, gang);
        gangs.manager_.gangs_.set(MockZoneDatabase.BA, gang);
    });

    // List index of the menu option to purchase new decorations.
    const kPurchaseDecorationIndex = 0;
    const kUpdateDecorationIndex = 1;
    const kRemoveDecorationIndex = 2;

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

    // Returns the most recent scoped object that's owned by the |commands|.
    function getMostRecentNonBoundaryObject() {
        const entities = commands.entities_;
        if (!entities.objects_.size)
            throw new Error(`Expected at least a single object to exist.`);
        
        for (const object of [...entities.objects_].reverse()) {
            if (!object.isConnected() || [ 11752, 11753 ].includes(object.modelId))
                continue;
            
            return object;
        }

        return null;
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
        assert.equal(russell.messages.length, 2);
        assert.equal(
            russell.messages[1], Message.format(Message.ZONE_NOT_IN_OWNED_ZONE, zone.gangName));

        russell.level = Player.LEVEL_ADMINISTRATOR;

        // (3) Administrators have to confirm they want to modify a non-owned zone.
        russell.respondToDialog({ response: 1 /* Confirm interference */ }).then(message => {
            assert.includes(message, 'should not interfere');
            return russell.respondToDialog({ response: 0 /* Dismiss */});
        });

        assert.isTrue(await russell.issueCommand('/zone'));
    });

    it('should enable players to purchase new decorations for their zone', async (assert) => {
        const zone = positionPlayerForFirstGangZone(russell);
        russell.gangId = zone.gangId;  // make |russell| part of the owning gang
        russell.level = Player.LEVEL_ADMINISTRATOR;

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

        // (3) Verify that sufficient funds must be available before starting the editor.
        gangs.getGangForPlayer(russell).balance = 25;

        russell.respondToDialog({ listitem: kPurchaseDecorationIndex }).then(
            () => russell.respondToDialog({ listitem: 0 /* First category */ })).then(
            () => russell.respondToDialog({ listitem: 0 /* First object */ })).then(
            () => russell.respondToDialog({ response: 0 /* Cancel */ }));

        assert.isTrue(await russell.issueCommand('/zone'));
        assert.includes(russell.lastDialog, 'Please deposit more money');

        gangs.getGangForPlayer(russell).balance = 25000000;

        // (4) Verify that the object will actually be positioned within the zone.
        russell.respondToDialog({ listitem: kPurchaseDecorationIndex }).then(
            () => russell.respondToDialog({ listitem: 0 /* First category */ })).then(
            () => russell.respondToDialog({ listitem: 0 /* First object */ })).then(
            () => russell.respondToDialog({ response: 0 /* Cancel */ }));

        const misplacedCommandPromise = russell.issueCommand('/zone');
        await runUntilObjectCountChanged();

        const misplacedObject = getMostRecentNonBoundaryObject();
        assert.isNotNull(misplacedObject);

        server.objectManager.onObjectEdited({
            objectid: misplacedObject.id,
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
        assert.isFalse(misplacedObject.isConnected());

        await misplacedCommandPromise;

        // (5) Complete the full purchase object flow for an object.
        russell.respondToDialog({ listitem: kPurchaseDecorationIndex }).then(
            () => russell.respondToDialog({ listitem: 0 /* First category */ })).then(
            () => russell.respondToDialog({ listitem: 0 /* First object */ })).then(
            () => russell.respondToDialog({ response: 0 /* Cancel */ }));

        const commandPromise = russell.issueCommand('/zone');
        await runUntilObjectCountChanged();

        const object = getMostRecentNonBoundaryObject();
        assert.isNotNull(object);

        server.objectManager.onObjectEdited({
            objectid: object.id,
            playerid: russell.id,
            response: 1,  // EDIT_RESPONSE_FINAL
            x: zone.area.center[0],
            y: zone.area.center[1],
            z: 10,
            rx: 0,
            ry: 0,
            rz: 0,
        });

        await commandPromise;

        assert.includes(russell.lastDialog, 'You have purchased');
        assert.isFalse(object.isConnected());

        assert.equal(russell.messages.length, 1);
        assert.includes(russell.messages[0], 'has purchased a');
    });

    it('should enable players to move around previously created objects', async (assert) => {
        const zone = positionPlayerForFirstGangZone(russell);
        russell.gangId = zone.gangId;  // make |russell| part of the owning gang
        russell.level = Player.LEVEL_ADMINISTRATOR;

        const decorations = manager.decorations.getObjectsForZone(zone);
        const decorationCount = decorations?.size ?? 0;
        assert.isDefined(decorations);

        // Create a decoration ourselves so that we can be sure what we're dealing with.
        const decorationId =
            await manager.decorations.createObject(zone, 1225, russell.position,
                                                   new Vector(0, 0, 0));

        const decoration = decorations.get(decorationId);
        assert.isDefined(decoration);
        assert.isTrue(decoration.isConnected());

        // Start the updating flow for |russell|. This combines all the boundary conditions that the
        // purchase and remove flows test for as well.
        russell.respondToDialog({ listitem: kUpdateDecorationIndex }).then(
            () => russell.respondToDialog({ response: 1 /* Confirm */ })).then(
            () => russell.respondToDialog({ response: 0 /* Dismiss */ }));

        const commandPromise = russell.issueCommand('/zone');
        await runUntilObjectCountChanged();

        server.playerManager.onPlayerSelectObject({
            playerid: russell.id,
            objectid: decoration.id,
            modelId: decoration.modelId,
            x: 0,
            y: 0,
            z: 0,
        });

        await runUntilObjectCountChanged();

        server.objectManager.onObjectEdited({
            objectid: decoration.id,
            playerid: russell.id,
            response: 1,  // EDIT_RESPONSE_FINAL
            x: zone.area.center[0],
            y: zone.area.center[1],
            z: 10,
            rx: 0,
            ry: 0,
            rz: 0,
        });

        await commandPromise;

        assert.isTrue(decorations.has(decorationId));
        assert.isTrue(decoration.isConnected());

        assert.equal(decoration.position.x, zone.area.center[0]);
        assert.equal(decoration.position.y, zone.area.center[1]);
    });

    it('should enable players to delete previously created objects', async (assert) => {
        const zone = positionPlayerForFirstGangZone(russell);
        russell.gangId = zone.gangId;  // make |russell| part of the owning gang
        russell.level = Player.LEVEL_ADMINISTRATOR;

        const decorations = manager.decorations.getObjectsForZone(zone);
        const decorationCount = decorations?.size ?? 0;
        assert.isDefined(decorations);

        // (1) Make sure the overview menu includes the number of live decorations.
        russell.respondToDialog({ response: 0 /* Cancel */ });

        assert.isTrue(await russell.issueCommand('/zone'));
        assert.includes(russell.lastDialog, `${decorationCount} decorations`);

        // Create a decoration ourselves so that we can be sure what we're dealing with.
        const decorationId =
            await manager.decorations.createObject(zone, 1225, russell.position,
                                                   new Vector(0, 0, 0));

        const decoration = decorations.get(decorationId);
        assert.isDefined(decoration);
        assert.isTrue(decoration.isConnected());

        // (2) Start the deletion flow to remove the created decoration again.
        russell.respondToDialog({ listitem: kRemoveDecorationIndex }).then(
            () => russell.respondToDialog({ response: 1 /* Confirm */ })).then(
            () => russell.respondToDialog({ response: 0 /* Dismiss */ }));

        const commandPromise = russell.issueCommand('/zone');
        await runUntilObjectCountChanged();

        server.playerManager.onPlayerSelectObject({
            playerid: russell.id,
            objectid: decoration.id,
            modelId: decoration.modelId,
            x: 0,
            y: 0,
            z: 0,
        });

        await commandPromise;

        assert.isFalse(decorations.has(decorationId));
        assert.isFalse(decoration.isConnected());
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
