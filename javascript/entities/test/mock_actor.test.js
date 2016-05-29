// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MockActor = require('entities/test/mock_actor.js');
const Vector = require('base/vector.js');

describe('MockActor', (it, beforeEach, afterEach) => {
    let actor = null;

    beforeEach(() => {
        const modelId = 121 /* Army */;
        const position = new Vector(1000, 1250, 10);
        const rotation = 180;

        actor = new MockActor({ didDisposeActor: () => 1 }, modelId, position, rotation);
    });

    afterEach(() => actor.dispose());

    it('should allow getting and setting the health as numbers', assert => {
        assert.equal(typeof actor.health, 'number');
        assert.equal(actor.health, 100);

        [0, 50, 100, 200, 2000].forEach(health => {
            assert.doesNotThrow(() => actor.health = health);
            assert.equal(actor.health, health);
        });

        assert.throws(() => actor.health = null);
        assert.throws(() => actor.health = 'infinite');
    });

    it('should allow getting the model Id of an actor as a number', assert => {
        assert.equal(typeof actor.modelId, 'number');
        assert.equal(actor.modelId, 121);

        assert.throws(() => actor.modelId = null);
        assert.throws(() => actor.modelId = 122);
    });

    it('should allow getting and setting the position of an actor as a Vector', assert => {
        assert.equal(typeof actor.position, 'object');
        assert.isTrue(actor.position instanceof Vector);
        assert.deepEqual(actor.position, new Vector(1000, 1250, 10));

        assert.doesNotThrow(() => actor.position = new Vector(2000, 2500, 20));
        assert.deepEqual(actor.position, new Vector(2000, 2500, 20));

        assert.throws(() => actor.position = null);
        assert.throws(() => actor.position = 42);
    });

    it('should allow getting and setting the rotation of an actor as a number', assert => {
        assert.equal(typeof actor.rotation, 'number');
        assert.equal(actor.rotation, 180);

        [0, 45, 90, 180, 269.5142, 360].forEach(rotation => {
            assert.doesNotThrow(() => actor.rotation = rotation);
            assert.equal(actor.rotation, rotation);
        });

        assert.throws(() => actor.rotation = null);
        assert.throws(() => actor.rotation = 'upside down');
    });

    it('should allow getting and setting the virtual world an actor is part of', assert => {
        assert.equal(typeof actor.virtualWorld, 'number');
        assert.equal(actor.virtualWorld, 0);

        [0, 50, 1000000, 1000000000].forEach(virtualWorld => {
            assert.doesNotThrow(() => actor.virtualWorld = virtualWorld);
            assert.equal(actor.virtualWorld, virtualWorld);
        });

        assert.throws(() => actor.virtualWorld = null);
        assert.throws(() => actor.virtualWorld = -1337);
        assert.throws(() => actor.virtualWorld = 4000000000);
        assert.throws(() => actor.virtualWorld = 'main world');
    });

    it('should allow reading and updating whether an actor is vulnerable', assert => {
        assert.equal(typeof actor.isVulnerable(), 'boolean');
        assert.isFalse(actor.isVulnerable());

        assert.doesNotThrow(() => actor.setVulnerable(false));
        assert.doesNotThrow(() => actor.setVulnerable(true));

        assert.isTrue(actor.isVulnerable());

        assert.throws(() => actor.setVulnerable());
        assert.throws(() => actor.setVulnerable(null));
        assert.throws(() => actor.setVulnerable('only for projectiles'));
    });

    // TODO(Russell): Test animate()
    // TODO(Russell): Test clearAnimations()

    it('should not be possible to add or delete properties from an actor', assert => {
        assert.isTrue(Object.isSealed(actor));

        assert.throws(() => actor.hat = null);
        assert.throws(() => actor.color = Color.fromRGB(255, 0, 0));

        assert.equal(actor.modelId, 121);

        delete actor.modelId;

        assert.equal(actor.modelId, 121);
    });

    it('should have an interface identical to that of a real Actor', assert => {
        const actorProperties = Object.getOwnPropertyNames(Actor.prototype).sort();
        const mockActorProperties = Object.getOwnPropertyNames(MockActor.prototype).sort();

        assert.deepEqual(mockActorProperties, actorProperties);
    });
});
