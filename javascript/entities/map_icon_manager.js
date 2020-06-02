// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MapIcon } from 'entities/map_icon.js';

// Manages the map icons that have been created on Las Venturas Playground. The actual icons are
// created by the Streamer, so no fixed limit has been put in place for them.
export class MapIconManager {
    iconConstructor_ = null;
    icons_ = null;

    constructor(iconConstructor = MapIcon) {
        this.iconConstructor_ = iconConstructor;
        this.icons_ = new Set();
    }

    get count() { return this.icons_.size; }

    // ---------------------------------------------------------------------------------------------

    // Creates a new map icon with the given options. Most are optional, only |position| (in 3D
    // space) and |type| are required. Constants are available in the MapIcon class.
    createMapIcon({ position, type, color = null, style = null, interiors = null, interiorId = -1,
                    virtualWorlds = null, virtualWorld = -1, players = null, playerId = -1,
                    streamDistance = null } = {}) {
        const mapIcon = new this.iconConstructor_(this);

        // Initializes the |mapIcon| with all the configuration passed to the manager.
        mapIcon.initialize({
            position: position,
            type: type,
            color: color ?? 0,
            style: style ?? MapIcon.kStyleLocal,

            streamDistance: streamDistance ?? 200.0,

            interiors: interiors ?? [ interiorId ],
            virtualWorlds: virtualWorlds ?? [ virtualWorld ],
            players: players ?? [ playerId ],
            areas: [ -1 ], 

            priority: 0,
        });

        this.icons_.add(mapIcon);
        return mapIcon;
    }

    // ---------------------------------------------------------------------------------------------

    didDisposeMapIcon(mapIcon) {
        if (!this.icons_.has(mapIcon))
            throw new Error('Attempting to dispose an invalid map icon: ' + mapIcon);

        this.icons_.delete(mapIcon);
    }

    dispose() {
        this.icons_.forEach(mapIcon => mapIcon.dispose());

        if (this.icons_.size != 0)
            throw new Error('There are remaining map icons after disposing all of them.');
    }
}
