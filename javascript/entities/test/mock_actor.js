// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Mocked implementation of the Actor entity. Supports the same API, but won't actually create an
// actor on the San Andreas: Multiplayer server.
class MockActor {
    // Creates a new actor. Do NOT use this constructor directly, instead get the ActorManager from
    // the global Server object and create your actors through there.
    constructor(manager, modelId, position, rotation) {
        this.manager_ = manager;

        if (typeof modelId !== 'number')
            throw new Error('The model Id of an actor must be a number.');

        if (typeof position !== 'object' || !(position instanceof Vector))
            throw new Error('The position of an actor must be a Vector.');

        if (typeof rotation !== 'number')
            throw new Error('The rotation of an actor must be a number.')

        this.connected_ = true;
        this.modelId_ = modelId;
        this.health_ = 100.0;
        this.position_ = position;
        this.rotation_ = rotation;
        this.virtualWorld_ = 0;
        this.vulnerable_ = false;

        Object.seal(this);  // prevent properties from being added or removed
    }

    // Returns whether the actor is still connected to the server.
    isConnected() { return this.connected_; }

    // Gets the model Id used to present this actor to other players.
    get modelId() { return this.modelId_; }

    // Gets or sets the health of this actor.
    get health() { return this.health_; }
    set health(value) {
        if (typeof value !== 'number')
            throw new Error('The health of an actor must be set to a number.');

        this.health_ = value;
    }

    // Gets or sets the position of this actor.
    get position() { return this.position_; }
    set position(value) {
        if (typeof value !== 'object' || !(value instanceof Vector))
            throw new Error('The position of an actor must be set to an object.');

        this.position_ = value;
    }

    // Gets or sets the rotation of this actor.
    get rotation() { return this.rotation_; }
    set rotation(value) {
        if (typeof value !== 'number')
            throw new Error('The rotation of an actor must be set to a number.');

        this.rotation_ = value;
    }

    // Gets or sets the virtual world this actor resides in.
    get virtualWorld() { return this.virtualWorld_; }
    set virtualWorld(value) {
        if (typeof value !== 'number' || value < 0 || value > 2147483646) {
            throw new Error('The virtual world of an actor must be set to a number between 0 and ' +
                            '2,147,483,646.');
        }

        this.virtualWorld_ = value;
    }

    // Note that actors are not tied to an interior: they show up everywhere.

    // Returns whether this actor is vulnerable. Actors are invulnerable by default.
    isVulnerable() { return this.vulnerable_; }

    // Sets whether this actor should be vulnerable.
    setVulnerable(value) {
        if (typeof value !== 'boolean')
            throw new Error('The vulnerability of an actor must be set as a boolean.');

        this.vulnerable_ = value;
    }

    // Applies the animation from |library| and |name| to the actor. The |loop| argument decides
    // whether it should loop until the |time| runs out. |lock| determines whether the actor should
    // be returned to their position after the animation finishes, and |freeze| determines whether
    // the actor should be frozen after the animation finishes.
    animate({ library, name, delta = 4.1, loop = false, lock = false, freeze = false,
              time = 0} = {}) {}

    // Clears any on-going animations for this actor.
    clearAnimations() {}

    // Disposes of the actor, and removes it from the server.
    dispose() {
        this.connected_ = false;
        this.manager_.didDisposeActor(this);
    }
}

exports = MockActor;
