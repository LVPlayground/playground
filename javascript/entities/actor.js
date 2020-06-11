// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Id of an invalid actor. May be returned when there are no available actor slots.
const INVALID_ID = 0xFFFF;

// An actor is a name-less character that can be spawned in Grand Theft Auto: San Andreas without
// taking up player slots. They have very basic interactions, options, and no events.
class Actor {
    // Creates a new actor. Do NOT use this constructor directly, instead get the ActorManager from
    // the global Server object and create your actors through there.
    constructor(manager, modelId, position, rotation) {
        this.manager_ = manager;

        this.modelId_ = modelId;
        this.id_ = pawnInvoke(
            'CreateActor', 'iffff', modelId, position.x, position.y, position.z, rotation);

        if (this.id_ == INVALID_ID)
            console.log('[Actor] Failed to create an actor with model Id ' + modelId +'.');
    }

    // Returns whether the actor is still connected to the server.
    isConnected() { return pawnInvoke('IsValidActor', 'i', this.id_); }

    // Gets the model Id used to present this actor to other players.
    get modelId() { return this.modelId_; }

    // Gets or sets the health of this actor.
    get health() { return pawnInvoke('GetActorHealth', 'iF', this.id_); }
    set health(value) { pawnInvoke('SetActorHealth', 'if', this.id_, value); }

    // Gets or sets the position of this actor.
    get position() { return new Vector(...pawnInvoke('GetActorPos', 'iFFF', this.id_)); }
    set position(value) { pawnInvoke('SetActorPos', 'ifff', this.id_, value.x, value.y, value.z); }

    // Gets or sets the rotation of this actor.
    get rotation() { return pawnInvoke('GetActorFacingAngle', 'iF', this.id_); }
    set rotation(value) { pawnInvoke('SetActorFacingAngle', 'if', this.id_, value); }

    // Gets or sets the virtual world this actor resides in.
    get virtualWorld() { return pawnInvoke('GetActorVirtualWorld', 'i', this.id_); }
    set virtualWorld(value) { pawnInvoke('SetActorVirtualWorld', 'ii', this.id_, value); }

    // Note that actors are not tied to an interior: they show up everywhere.

    // Returns whether this actor is vulnerable. Actors are invulnerable by default.
    isVulnerable() { return !pawnInvoke('IsActorInvulnerable', 'i', this.id_); }

    // Sets whether this actor should be invulnerable.
    setVulnerable(value) { pawnInvoke('SetActorInvulnerable', 'ii', this.id_, value ? 0 : 1); }

    // Applies the animation from |library| and |name| to the actor. The |loop| argument decides
    // whether it should loop until the |time| runs out. |lock| determines whether the actor should
    // be returned to their position after the animation finishes, and |freeze| determines whether
    // the actor should be frozen after the animation finishes.
    animate({ library, name, delta = 4.1, loop = false, lock = false, freeze = false,
              time = 0 } = {}) {
        pawnInvoke('ApplyActorAnimation', 'issfiiiii', this.id_, library, name, delta, loop ? 1 : 0,
                                                       lock ? 1 : 0, lock ? 1 : 0, freeze ? 1 : 0,
                                                       time);
    }

    // Clears any on-going animations for this actor.
    clearAnimations() { pawnInvoke('ClearActorAnimations', 'i', this.id_); }

    // Disposes of the actor, and removes it from the server.
    dispose() {
        pawnInvoke('DestroyActor', 'i', this.id_);
        this.id_ = INVALID_ID;

        this.manager_.didDisposeActor(this);
    }

    // ---------------------------------------------------------------------------------------------

    toString() { return `[object Actor(${this.id_}, ${this.modelId_})]`; }
}

// Expose the Actor object globally since it is an entity.
global.Actor = Actor;
