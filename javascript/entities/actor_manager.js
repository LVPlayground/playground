// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Actor } from 'entities/actor.js';

// The actor manager maintains and owns all actors that have been created on the server. There are
// no events supported by the manager right now, so it does not enable observers to be attached.
export class ActorManager {
    constructor(actorConstructor = Actor) {
        this.actorConstructor_ = actorConstructor;
        this.actors_ = new Set();
    }

    // Gets the number of actors currently created on the server.
    get count() { return this.actors_.size; }

    // Creates a new actor with the given options. Actors do not have names.
    createActor({ modelId = 0, position, rotation = 0 } = {}) {
        const actor = new this.actorConstructor_(this, modelId, position, rotation);
        this.actors_.add(actor);

        return actor;
    }

    // Removes the |actor| from the maintained set of actors. Should only be used by the Actor
    // implementation to inform the manager about their disposal.
    didDisposeActor(actor) {
        if (!this.actors_.has(actor))
            throw new Error('Attempting to dispose an invalid actor: ' + actor);

        this.actors_.delete(actor);
    }

    // Removes all existing actors from the server.
    dispose() {
        this.actors_.forEach(actor => actor.dispose());

        if (this.actors_.size != 0)
            throw new Error('There are remaining actors after disposing all of them.');
    }
}
