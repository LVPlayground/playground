// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Area } from 'entities/area.js';
import { Rect } from 'base/rect.js';
import ScopedEntities from 'entities/scoped_entities.js';

describe('ScopedEntities', it => {
    it('should be able to create and dispose of scoped actors', assert => {
        const entities = new ScopedEntities();

        const actor = entities.createActor({ modelId: 121, position: new Vector(12, 13, 14) });
        assert.isNotNull(actor);

        assert.isTrue(entities.hasActor(actor));
        assert.isTrue(actor.isConnected());

        entities.dispose();

        assert.isFalse(entities.hasActor(actor));
        assert.isFalse(actor.isConnected());
    });

    it('should not identify actors owned by other systems as part of a scoped set', assert => {
        const entities = new ScopedEntities();
        const actor =
            server.actorManager.createActor({ modelId: 121, position: new Vector(12, 13, 14) });

        assert.isTrue(actor.isConnected());
        assert.isFalse(entities.hasActor(actor));

        entities.dispose();

        assert.isTrue(actor.isConnected());
    });

    // ---------------------------------------------------------------------------------------------

    it('should be able to create and dispose of scoped map icons', assert => {
        const entities = new ScopedEntities();

        const mapIcon = entities.createMapIcon({ position: new Vector(1, 2, 3), type: 10 });

        assert.isNotNull(mapIcon);
        assert.isTrue(mapIcon.isConnected());

        assert.isTrue(entities.hasMapIcon(mapIcon));

        entities.dispose();

        assert.isFalse(mapIcon.isConnected());
    });

    it('should not identify objects owned by other systems as part of a scoped set', assert => {
        const entities = new ScopedEntities();
        const mapIcon =
            server.mapIconManager.createMapIcon({ position: new Vector(1, 2, 3), type: 10 });

        assert.isTrue(mapIcon.isConnected());
        assert.isFalse(entities.hasMapIcon(mapIcon));

        entities.dispose();

        assert.isFalse(entities.hasMapIcon(mapIcon));
        assert.isTrue(mapIcon.isConnected());
    });

    // ---------------------------------------------------------------------------------------------

    it ('should be able to create and dispose of scoped NPCs', assert => {
        const entities = new ScopedEntities();

        const npc = entities.createNpc({ name: 'Joe', pawnScript: 'bot' });
        assert.isNotNull(npc);

        assert.isTrue(entities.hasNpc(npc));
        assert.isTrue(npc.isConnecting());
        assert.isFalse(npc.isDisconnecting());

        entities.dispose();

        assert.isTrue(npc.isDisconnecting());
    });

    it('should not identify NPCs owned by other systems as part of a scoped set', assert => {
        const entities = new ScopedEntities();
        const npc = server.npcManager.createNpc({ name: 'Joe', pawnScript: 'bot' });

        assert.isTrue(npc.isConnecting());
        assert.isFalse(npc.isDisconnecting());

        assert.isFalse(entities.hasNpc(npc));

        entities.dispose();

        assert.isTrue(npc.isConnecting());
        assert.isFalse(npc.isDisconnecting());
    });

    // ---------------------------------------------------------------------------------------------

    it('should be able to create and dispose of scoped objects', assert => {
        const entities = new ScopedEntities();

        const object = entities.createObject({ modelId: 1225, position: new Vector(1, 2, 3),
                                               rotation: new Vector(4, 5, 6) });
        assert.isNotNull(object);
        assert.isTrue(object.isConnected());

        assert.isTrue(entities.hasObject(object));

        entities.dispose();

        assert.isFalse(object.isConnected());
    });

    it('should not identify objects owned by other systems as part of a scoped set', assert => {
        const entities = new ScopedEntities();
        const object =
            server.objectManager.createObject({ modelId: 1225, position: new Vector(1, 2, 3),
                                                rotation: new Vector(4, 5, 6) });

        assert.isTrue(object.isConnected());
        assert.isFalse(entities.hasVehicle(object));

        entities.dispose();

        assert.isFalse(entities.hasVehicle(object));
        assert.isTrue(object.isConnected());
    });

    // ---------------------------------------------------------------------------------------------

    it('should be able to create and dispose of scoped pickups', assert => {
        const entities = new ScopedEntities();

        const pickup = entities.createPickup({ modelId: 322, position: new Vector(0, 0, 0) });
        assert.isNotNull(pickup);
        assert.isTrue(pickup.isConnected());

        assert.isTrue(entities.hasPickup(pickup));

        entities.dispose();

        assert.isFalse(pickup.isConnected());
    });

    it('should not identify pickups owned by other systems as part of a scoped set', assert => {
        const entities = new ScopedEntities();
        const pickup =
            server.pickupManager.createPickup({ modelId: 322, position: new Vector(0, 0, 0) });

        assert.isTrue(pickup.isConnected());
        assert.isFalse(entities.hasTextLabel(pickup));

        entities.dispose();

        assert.isFalse(entities.hasTextLabel(pickup));
        assert.isTrue(pickup.isConnected());
    });

    // ---------------------------------------------------------------------------------------------

    it('should be able to create and dispose of scoped text labels', assert => {
        const entities = new ScopedEntities();

        const textLabel = entities.createTextLabel({ text: 'Hi', position: new Vector(0, 0, 0) });
        assert.isNotNull(textLabel);
        assert.isTrue(textLabel.isConnected());

        assert.isTrue(entities.hasTextLabel(textLabel));

        entities.dispose();

        assert.isFalse(textLabel.isConnected());
    });

    it('should not identify text labels owned by other systems as part of a scoped set', assert => {
        const entities = new ScopedEntities();
        const textLabel =
            server.textLabelManager.createTextLabel({ text: 'Hi', position: new Vector(0, 0, 0) });

        assert.isTrue(textLabel.isConnected());
        assert.isFalse(entities.hasTextLabel(textLabel));

        entities.dispose();

        assert.isFalse(entities.hasTextLabel(textLabel));
        assert.isTrue(textLabel.isConnected());
    });

    // ---------------------------------------------------------------------------------------------

    it('should be able to create and dispose of scoped vehicles', assert => {
        const entities = new ScopedEntities();

        const vehicle = entities.createVehicle({ modelId: 411, position: new Vector(12, 13, 14) });
        assert.isNotNull(vehicle);
        assert.isTrue(vehicle.isConnected());

        assert.isTrue(entities.hasVehicle(vehicle));

        entities.dispose();

        assert.isFalse(vehicle.isConnected());
    });

    it('should not identify vehicles owned by other systems as part of a scoped set', assert => {
        const entities = new ScopedEntities();
        const vehicle =
            server.vehicleManager.createVehicle({ modelId: 411, position: new Vector(12, 13, 14) });

        assert.isTrue(vehicle.isConnected());
        assert.isFalse(entities.hasVehicle(vehicle));

        entities.dispose();

        assert.isFalse(entities.hasVehicle(vehicle));
        assert.isTrue(vehicle.isConnected());
    });

    // ---------------------------------------------------------------------------------------------

    it('should create entities in the main interior and virtual world by default', assert => {
        const entities = new ScopedEntities();

        assert.equal(entities.interiorId, 0);
        assert.equal(entities.virtualWorld, 0);

        const actor = entities.createActor({ modelId: 121, position: new Vector(12, 13, 14) });
        assert.equal(actor.virtualWorld, 0);

        const object = entities.createObject({ modelId: 1225, position: new Vector(1, 2, 3),
                                               rotation: new Vector(4, 5, 6) });
        assert.deepEqual(object.interiors, [ -1 ]);
        assert.deepEqual(object.virtualWorlds, [ -1 ]);

        const pickup = entities.createPickup({ modelId: 322, position: new Vector(0, 0, 0) });
        assert.deepEqual(pickup.interiors, [ -1 ] );
        assert.deepEqual(pickup.virtualWorlds, [ -1 ] );

        const textLabel = entities.createTextLabel({ text: 'Hi', position: new Vector(0, 0, 0) });
        assert.deepEqual(textLabel.interiors, [ -1 ]);
        assert.deepEqual(textLabel.virtualWorlds, [ -1 ]);

        const vehicle = entities.createVehicle({ modelId: 411, position: new Vector(12, 13, 14) });
        assert.equal(vehicle.interiorId, 0);
        assert.equal(vehicle.virtualWorld, 0);
    });

    it('should be able to create entities in an associated interior and virtual world', assert => {
        const entities = new ScopedEntities({ interiorId: 7, virtualWorld: 42 });

        assert.equal(entities.interiorId, 7);
        assert.equal(entities.virtualWorld, 42);

        const actor = entities.createActor({ modelId: 121, position: new Vector(12, 13, 14) });
        assert.equal(actor.virtualWorld, 42);

        const object = entities.createObject({ modelId: 1225, position: new Vector(1, 2, 3),
                                               rotation: new Vector(4, 5, 6) });
        assert.deepEqual(object.interiors, [ 7 ]);
        assert.deepEqual(object.virtualWorlds, [ 42 ]);

        const pickup = entities.createPickup({ modelId: 322, position: new Vector(0, 0, 0) });
        assert.deepEqual(pickup.interiors, [ 7 ]);
        assert.deepEqual(pickup.virtualWorlds, [ 42 ]);

        const textLabel = entities.createTextLabel({ text: 'Hi', position: new Vector(0, 0, 0) });
        assert.deepEqual(textLabel.interiors, [ 7 ]);
        assert.deepEqual(textLabel.virtualWorlds, [ 42 ]);

        const vehicle = entities.createVehicle({ modelId: 411, position: new Vector(12, 13, 14) });
        assert.equal(vehicle.interiorId, 7);
        assert.equal(vehicle.virtualWorld, 42);
    });

    it('should not be possible to create scoped entities after the object is disposed', assert => {
        const entities = new ScopedEntities();
        entities.dispose();

        assert.throws(() =>
            entities.createActor({ modelId: 121, position: new Vector(12, 13, 14) }));

        assert.throws(() =>
            entities.createObject({ modelId: 1225, position: new Vector(1, 2, 3),
                                    rotation: new Vector(4, 5, 6) }));

        assert.throws(() =>
            entities.createPickup({ modelId: 322, position: new Vector(0, 0, 0) }));

        assert.throws(() =>
            entities.createTextLabel({ text: 'Hi', position: new Vector(0, 0, 0) }));

        assert.throws(() =>
            entities.createVehicle({ modelId: 411, position: new Vector(12, 13, 14) }));
    });

    it('supports areas to be created on the server', async (assert) => {
        const center = new Vector(10, 20, 30);
        const radius = 40;
        const rect = new Rect(50, 60, 70, 80);
        const points = [ [ 10, 10 ], [ 60, 60 ], [ 110, 10 ] ];  // a triangle
        const minimumZ = 90;
        const maximumZ = 100;

        const entities = new ScopedEntities();

        const circle = entities.createCircularArea(center, radius);
        assert.isTrue(entities.hasArea(circle));

        assert.isTrue(circle.isConnected());
        assert.equal(circle.type, Area.kTypeCircle);
        assert.deepEqual(circle.center, center);
        assert.equal(circle.radius, radius);

        const cube = entities.createCubicalArea(rect, minimumZ, maximumZ);
        assert.isTrue(entities.hasArea(cube));

        assert.isTrue(cube.isConnected());
        assert.equal(cube.type, Area.kTypeCube);
        assert.deepEqual(cube.rectangle, rect);
        assert.equal(cube.minimumZ, minimumZ);
        assert.equal(cube.maximumZ, maximumZ);

        const cylinder = entities.createCylindricalArea(center, radius, minimumZ, maximumZ);
        assert.isTrue(entities.hasArea(cylinder));

        assert.isTrue(cylinder.isConnected());
        assert.equal(cylinder.type, Area.kTypeCylinder);
        assert.deepEqual(cylinder.center, center);
        assert.equal(cylinder.radius, radius);
        assert.equal(cylinder.minimumZ, minimumZ);
        assert.equal(cylinder.maximumZ, maximumZ);

        const polygon = entities.createPolygonalArea(points, minimumZ, maximumZ);
        assert.isTrue(entities.hasArea(polygon));

        assert.isTrue(polygon.isConnected());
        assert.equal(polygon.type, Area.kTypePolygon);
        assert.deepEqual(polygon.points, points);
        assert.equal(polygon.minimumZ, minimumZ);
        assert.equal(polygon.maximumZ, maximumZ);

        const rectangle = entities.createRectangularArea(rect);
        assert.isTrue(entities.hasArea(rectangle));

        assert.isTrue(rectangle.isConnected());
        assert.equal(rectangle.type, Area.kTypeRectangle);
        assert.deepEqual(rectangle.rectangle, rect);

        const sphere = entities.createSphericalArea(center, radius);
        assert.isTrue(entities.hasArea(sphere));

        assert.isTrue(sphere.isConnected());
        assert.equal(sphere.type, Area.kTypeSphere);
        assert.deepEqual(sphere.center, center);
        assert.equal(sphere.radius, radius);

        entities.dispose();

        assert.isFalse(circle.isConnected());
        assert.isFalse(cube.isConnected());
        assert.isFalse(cylinder.isConnected());
        assert.isFalse(polygon.isConnected());
        assert.isFalse(rectangle.isConnected());
        assert.isFalse(sphere.isConnected());
    });

    it('is able to prune objects maintained within the ScopedEntities', assert => {
        const entities = new ScopedEntities();

        const actor = entities.createActor({ modelId: 121, position: new Vector(12, 13, 14) });
        assert.isNotNull(actor);

        assert.isTrue(entities.hasActor(actor));
        assert.isTrue(actor.isConnected());

        actor.dispose();

        assert.isTrue(entities.hasActor(actor));
        assert.isFalse(actor.isConnected());

        entities.prune();

        assert.isFalse(entities.hasActor(actor));
        assert.isFalse(actor.isConnected());

        entities.dispose();
    });
});
