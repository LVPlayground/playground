// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Vector = require('base/vector.js');

// Mocked implementation of the Actor entity. Supports the same API, but won't actually create an
// actor on the San Andreas: Multiplayer server.
class MockActor {
    // Creates a new actor. Do NOT use this constructor directly, instead get the ActorManager from
    // the global Server object and create your actors through there.
    constructor(manager, modelId, position, rotation) {
        this.manager_ = manager;

        this.connected_ = true;
        this.modelId_ = modelId;
        this.health_ = 100.0;
        this.position_ = position;
        this.rotation_ = rotation;
        this.virtualWorld_ = 0;
        this.invulnerable_ = false;
    }

    // Returns whether the actor is still connected to the server.
    isConnected() { return this.connected_; }

    // Gets the model Id used to present this actor to other players.
    get modelId() { return this.modelId_; }

    // Gets or sets the health of this actor.
    get health() { return this.health_; }
    set health(value) { this.health_ = value; }

    // Gets or sets the position of this actor.
    get position() { return this.position_; }
    set position(value) { this.position_ = value; }

    // Gets or sets the rotation of this actor.
    get rotation() { return this.rotation_; }
    set rotation(value) { this.rotation_ = value; }

    // Gets or sets the virtual world this actor resides in.
    get virtualWorld() { return this.virtualWorld_; }
    set virtualWorld(value) { this.virtualWorld_ = value; }

    // Note that actors are not tied to an interior: they show up everywhere.

    // Returns whether this actor is invulnerable.
    isInvulnerable() { return this.invulnerable_; }

    // Sets whether this actor should be invulnerable.
    setInvulnerable(value) { this.invulnerable_ = value; }

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
