// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Area } from 'entities/area.js';

// The area manager is able to create areas of various shapes, which each player's position will be
// checked against at a certain frequency. This allows for events when players enter or leave areas.
export class AreaManager {
    areaConstructor_ = null;
    areas_ = null;

    constructor(areaConstructor = Area) {
        this.areaConstructor_ = areaConstructor;
        this.areas_ = new Map();
    }

    // ---------------------------------------------------------------------------------------------
    // Section: creating a new area
    // ---------------------------------------------------------------------------------------------

    // Creates a circular area consisting of |radius| units around the |center|. The z-coordinate of
    // both the |center| and the player's position will be ignored.
    createCircularArea(center, radius, { virtualWorlds = null, virtualWorld = -1, interiors = null,
                                         interiorId = -1, players = null, playerId = -1 } = {}) {
        const area = new this.areaConstructor_(this);
        area.initialize(Area.kTypeCircle, [ center, radius ], {
            virtualWorlds: virtualWorlds ?? [ virtualWorld ],
            interiors: interiors ?? [ interiorId ],
            players: players ?? [ playerId ],
        });

        this.areas_.set(area.id, area);
        return area;
    }

    // Creates a cubicle area consisting of the |rectangle|, from the |minimumZ| until the
    // |maximumZ| coordinates.
    createCubicalArea(rectangle, minimumZ, maximumZ, { virtualWorlds = null, virtualWorld = -1,
                                                       interiors = null, interiorId = -1,
                                                       players = null, playerId = -1 } = {}) {
        const area = new this.areaConstructor_(this);
        area.initialize(Area.kTypeCube, [ rectangle, minimumZ, maximumZ ], {
            virtualWorlds: virtualWorlds ?? [ virtualWorld ],
            interiors: interiors ?? [ interiorId ],
            players: players ?? [ playerId ],
        });

        this.areas_.set(area.id, area);
        return area;
    }

    // Creates a vertically cylindrical area consisting of |radius| units around the |center|, from
    // the |minimumZ| until the |maximumZ| coordinates.
    createCylindricalArea(center, radius, minimumZ, maximumZ, { virtualWorlds = null,
                                                                virtualWorld = -1, interiors = null,
                                                                interiorId = -1, players = null,
                                                                playerId = -1 } = {}) {
        const area = new this.areaConstructor_(this);
        area.initialize(Area.kTypeCylinder, [ center, radius, minimumZ, maximumZ ], {
            virtualWorlds: virtualWorlds ?? [ virtualWorld ],
            interiors: interiors ?? [ interiorId ],
            players: players ?? [ playerId ],
        });

        this.areas_.set(area.id, area);
        return area;
    }

    // Creates a polygonal area for each of the |points|, from the |minimumZ| until the |maximumZ|.
    // Each entry in |points| must be an array with two values, [x, y].
    createPolygonalArea(points, minimumZ, maximumZ, { virtualWorlds = null, virtualWorld = -1,
                                                      interiors = null, interiorId = -1,
                                                      players = null, playerId = -1 } = {}) {
        const area = new this.areaConstructor_(this);
        area.initialize(Area.kTypePolygon, [ points, minimumZ, maximumZ ], {
            virtualWorlds: virtualWorlds ?? [ virtualWorld ],
            interiors: interiors ?? [ interiorId ],
            players: players ?? [ playerId ],
        });

        this.areas_.set(area.id, area);
        return area;
    }

    // Creates a rectangular area consisting of the |rectangle|. The z-coordinate of the player's
    // position will be ignored.
    createRectangularArea(rectangle, { virtualWorlds = null, virtualWorld = -1, interiors = null,
                                       interiorId = -1, players = null, playerId = -1 } = {}) {
        const area = new this.areaConstructor_(this);
        area.initialize(Area.kTypeRectangle, [ rectangle ], {
            virtualWorlds: virtualWorlds ?? [ virtualWorld ],
            interiors: interiors ?? [ interiorId ],
            players: players ?? [ playerId ],
        });

        this.areas_.set(area.id, area);
        return area;
    }

    // Creates a spherical area consisting of |radius| units around the |center| for {x, y, z}.
    createSphericalArea(center, radius, { virtualWorlds = null, virtualWorld = -1, interiors = null,
                                          interiorId = -1, players = null, playerId = -1 } = {}) {
        const area = new this.areaConstructor_(this);
        area.initialize(Area.kTypeSphere, [ center, radius ], {
            virtualWorlds: virtualWorlds ?? [ virtualWorld ],
            interiors: interiors ?? [ interiorId ],
            players: players ?? [ playerId ],
        });

        this.areas_.set(area.id, area);
        return area;
    }

    // ---------------------------------------------------------------------------------------------

    onPlayerEnterArea(event) {
        const area = this.areas_.get(event.areaid);
        const player = server.playerManager.getById(event.playerid);

        if (!area || !player)
            return;  // this event wasn't intended for JavaScript
        
        for (const observer of area.observers)
            observer.onPlayerEnterArea(player, area);
    }

    onPlayerLeaveArea(event) {
        const area = this.areas_.get(event.areaid);
        const player = server.playerManager.getById(event.playerid);

        if (!area || !player)
            return;  // this event wasn't intended for JavaScript
        
        for (const observer of area.observers)
            observer.onPlayerLeaveArea(player, area);
    }

    // ---------------------------------------------------------------------------------------------

    didDisposeArea(area) {
        if (!this.areas_.has(area.id))
            throw new Error('Attempting to dispose an invalid area: ' + area);

        this.areas_.delete(area.id);
    }

    dispose() {
        this.areas_.forEach(area => area.dispose());

        if (this.areas_.size != 0)
            throw new Error('There are remaining areas after disposing all of them.');
    }
}
