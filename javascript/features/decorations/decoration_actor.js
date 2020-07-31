// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Vector } from 'base/vector.js';

// Delay, in milliseconds, after which we'll start to animate the actor. This makes sure that it has
// been streamed in sufficiently for all nearby players.
const kActorAnimationDelayMs = 3500;

// Encapsulates information about a decorative actor, positioned somewhere in the world and
// potentially executing an animation.
export class DecorationActor {
    #animation_ = null;
    #modelId_ = null;
    #position_ = null;
    #rotation_ = null;

    constructor(information) {
        this.#modelId_ = information.modelId;
        this.#position_ = new Vector(...information.position);
        this.#rotation_ = information.rotation;

        if (information.hasOwnProperty('animation'))
            this.#animation_ = information.animation;
    }

    // Enables the actor, connects them to the server and applies all the configuration that has
    // been given to us through the JSON configuration.
    enable(entities) {
        const actor = entities.createActor({
            modelId: this.#modelId_,
            position: this.#position_,
            rotation: this.#rotation_,
        });

        if (!this.#animation_)
            return;  // there is no animation to apply to this actor

        wait(kActorAnimationDelayMs).then(() => {
            if (!actor.isConnected())
                return;  // the actor has been disabled since

            actor.animate(this.#animation_);
        });
    }
}
