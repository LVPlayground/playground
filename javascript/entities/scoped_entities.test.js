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

    // TODO(Russell): Test with objects once that moves to an object manager.

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

        // TODO(Russell): Test with objects when that mess has been cleaned up.

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

        // TODO(Russell): Test with objects when that mess has been cleaned up.

        const vehicle = entities.createVehicle({ modelId: 411, position: new Vector(12, 13, 14) });
        assert.equal(vehicle.interiorId, 7);
        assert.equal(vehicle.virtualWorld, 42);
    });

    it('should not be possible to create scoped entities after the object is disposed', assert => {
        const entities = new ScopedEntities();
        entities.dispose();

        assert.throws(() =>
            entities.createActor({ modelId: 121, position: new Vector(12, 13, 14) }));

        // TODO(Russell): Test with objects when that mess has been cleaned up.

        assert.throws(() =>
            entities.createVehicle({ modelId: 411, position: new Vector(12, 13, 14) }));
    });
});
