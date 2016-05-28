// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ScopedEntities = require('entities/scoped_entities.js');
const Vector = require('base/vector.js');

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
        assert.equal(object.interiorId, -1);
        assert.equal(object.virtualWorld, -1);

        const pickup = entities.createPickup({ modelId: 322, position: new Vector(0, 0, 0) });
        assert.equal(pickup.virtualWorld, 0);

        const textLabel = entities.createTextLabel({ text: 'Hi', position: new Vector(0, 0, 0) });
        assert.equal(textLabel.virtualWorld, 0);

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
        assert.equal(object.interiorId, 7);
        assert.equal(object.virtualWorld, 42);

        const pickup = entities.createPickup({ modelId: 322, position: new Vector(0, 0, 0) });
        assert.equal(pickup.virtualWorld, 42);

        const textLabel = entities.createTextLabel({ text: 'Hi', position: new Vector(0, 0, 0) });
        assert.equal(textLabel.virtualWorld, 42);

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
});
