// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Supplementable } from 'base/supplementable.js';

// Represents an icon on the map. Doesn't have many options, only the ability to be destroyed after
// creation. Represented as an Entity so that it ties in well with other infrastructure.
export class MapIcon extends Supplementable {
    // Id to represent an invalid map icon. Maps to INVALID_STREAMER_ID, which is (0).
    static kInvalidId = 0;

    // The different styles of map icons that are available in GTA: San Andreas.
    static kStyleLocal = 0;
    static kStyleLocalCheckpoint = 2;
    static kStyleGlobal = 1;
    static kStyleGlobalCheckpoint = 3;

    #id_ = null;
    #manager_ = null;

    #position_ = null;
    #type_ = null;
    #color_ = null;
    #style_ = null;

    #streamDistance_ = null;

    #interiors_ = null;
    #players_ = null;
    #virtualWorlds_ = null;

    constructor(manager) {
        super();

        this.#manager_ = manager;
    }
    
    // Initializes the map icon on the server. Will call the |createInternal| method to actually
    // create the map icon on the server, through the samp-incognito-streamer plugin.
    initialize(options) {
        this.#position_ = options.position;
        this.#type_ = options.type;
        this.#color_ = options.color;
        this.#style_ = options.style;

        this.#streamDistance_ = options.streamDistance;

        this.#interiors_ = options.interiors;
        this.#players_ = options.players;
        this.#virtualWorlds_ = options.virtualWorlds;

        this.#id_ = this.createInternal(options);
    }

    // Actually creates a map icon on the server. Returns the ID of the created icon.
    createInternal(options) {
        return pawnInvoke('CreateDynamicMapIconEx', 'fffiiifaaaaiiiii',
            /* x= */ options.position.x,
            /* y= */ options.position.y,
            /* z= */ options.position.z,
            /* type= */ options.type,
            /* color= */ options.color,
            /* style= */ options.style,
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

    // Actually destroys a map icon from the server. May be overridden for tests.
    destroyInternal() { pawnInvoke('DestroyDynamicMapIcon', 'i', this.#id_); }

    // ---------------------------------------------------------------------------------------------

    get id() { return this.#id_; }

    get position() { return this.#position_; }
    get type() { return this.#type_; }
    get color() { return this.#color_; }
    get style() { return this.#style_; }

    get streamDistance() { return this.#streamDistance_; }

    get interiors() { return this.#interiors_; }
    get players() { return this.#players_; }
    get virtualWorlds() { return this.#virtualWorlds_; }

    isConnected() { return this.#id_ !== MapIcon.kInvalidId; }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.destroyInternal();

        this.#manager_.didDisposeMapIcon(this);
        this.#manager_ = null;

        this.#id_ = MapIcon.kInvalidId;
    }
}
