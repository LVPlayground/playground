// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Supplementable } from 'base/supplementable.js';

// Represents a pickup on the server. They are some of the wackiest entities available as they
// pretend to have respawning ability, but actually don't. At least not really. Our JavaScript code
// presents a slightly higher level API over them, with consistent and dependable behaviour.
export class Pickup extends Supplementable {
    // Id to represent an invalid pickup. Maps to INVALID_STREAMER_ID, which is (0).
    static kInvalidId = 0;

    // The type of pickup, which defines its behaviour. While any of the documented values is
    // technically possible, we recommend sticking to the following.
    // https://wiki.sa-mp.com/wiki/PickupTypes
    static kTypeDefault = 1;
    static kTypeVehicle = 14;

    #id_ = null;
    #manager_ = null;

    #modelId_ = null;
    #type_ = null;
    #position_ = null;

    #respawnDelay_ = null;
    #respawnOptions_ = null;
    #respawnPending_ = null;

    #streamDistance_ = null;

    #interiors_ = null;
    #players_ = null;
    #virtualWorlds_ = null;

    constructor(manager) {
        super();

        this.#manager_ = manager;
    }
    
    // Initializes the pickup on the server. Will call the |createInternal| method to actually
    // create the pickup on the server, through the samp-incognito-streamer plugin.
    initialize(options) {
        this.#modelId_ = options.modelId;
        this.#type_ = options.type;
        this.#position_ = options.position;

        this.#respawnDelay_ = options.respawnDelay;
        this.#respawnOptions_ = options;
        this.#respawnPending_ = false;
        
        this.#streamDistance_ = options.streamDistance;

        this.#interiors_ = options.interiors;
        this.#players_ = options.players;
        this.#virtualWorlds_ = options.virtualWorlds;

        this.#id_ = this.createInternal(options);
    }

    // Actually creates a pickup on the server. Returns the ID of the created pickup.
    createInternal(options) {
        return pawnInvoke('CreateDynamicPickupEx', 'iiffffaaaaiiiii',
            /* modelId= */ options.modelId,
            /* type= */ options.type,
            /* x= */ options.position.x,
            /* y= */ options.position.y,
            /* z= */ options.position.z,
            /* streamdistance= */ options.streamDistance,
            /* worlds= */ options.virtualWorlds,
            /* interiors= */ options.interiors,
            /* players= */ options.players,
            /* areas= */ options.areas,
            /* priority= */ options.priority,
            /* maxworlds= */ options.virtualWorlds.length,
            /* maxinteriors= */ options.interiors.length,
            /* maxplayers= */ options.players.length,
            /* maxareas= */ options.areas.length);
    }

    // Schedules the pickup to respawn after the configured delay.
    async respawnInternal() {
        this.destroyInternal();

        this.#id_ = Pickup.kInvalidId;
        this.#respawnPending_ = true;

        await wait(this.#respawnDelay_ * 1000);

        if (!this.#respawnPending_)
            return;  // |this| got disposed of in the interim
        
        this.#respawnPending_ = false;
        this.#id_ = this.createInternal(this.#respawnOptions_);

        this.#manager_.didRespawnPickup(this);
    }

    // Actually destroys this pickup from the server. May be overridden for tests.
    destroyInternal() { pawnInvoke('DestroyDynamicPickup', 'i', this.#id_); }

    // ---------------------------------------------------------------------------------------------

    get id() { return this.#id_; }

    get modelId() { return this.#modelId_; }
    get type() { return this.#type_; }
    get position() { return this.#position_; }
    get respawnDelay() { return this.#respawnDelay_; }

    get streamDistance() { return this.#streamDistance_; }

    get interiors() { return this.#interiors_; }
    get players() { return this.#players_; }
    get virtualWorlds() { return this.#virtualWorlds_; }

    isConnected() { return this.#id_ !== Pickup.kInvalidId || this.#respawnPending_; }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        if (!this.#respawnPending_)
            this.destroyInternal();

        this.#respawnPending_ = false;

        this.#manager_.didDisposePickup(this);
        this.#manager_ = null;

        this.#id_ = Pickup.kInvalidId;
    }

    // ---------------------------------------------------------------------------------------------

    toString() { return `[object Pickup(${this.#id_}, ${this.#modelId_})]`; }
}

// Expose the Pickup object globally since it is an entity.
global.Pickup = Pickup;
