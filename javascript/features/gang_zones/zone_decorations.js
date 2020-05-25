// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import ScopedEntities from 'entities/scoped_entities.js';

// Responsible for managing decorations that gangs have added to their zones. They are able to add
// as many objects are they want (within reasonable boundaries), but each object has to be paid for
// at a configured interval. Decoration management can be started through the "/zone" command.
export class ZoneDecorations {
    database_ = null;
    entities_ = null;
    zones_ = null;

    constructor(database) {
        this.database_ = database;
        this.zones_ = new Map();

        this.entities_ = new ScopedEntities({
            interiorId: 0,
            virtualWorld: 0,
        });
    }

    // ---------------------------------------------------------------------------------------------

    // Gets an iterator with the objects created for the given |zone|, or undefined.
    getObjectsForZone(zone) { return this.zones_.get(zone)?.values(); }

    // ---------------------------------------------------------------------------------------------

    // Creates the described object for the given |zone|. It will be written to the database, to
    // make sure that the object will continue to appear in subsequent playing sessions.
    async createObject(zone, modelId, position, rotation) {
        if (!this.zones_.has(zone))
            throw new Error(`Requested to create an object for an unknown zone: ${zone}`);

        const decorationId =
            this.database_.createDecoration(zone.gangId, modelId, position, rotation);

        if (!decorationId)
            return;  // the decoration could not be stored in the database
        
        const objects = this.zones_.get(zone);
        const object = this.entities_.createObject({ modelId, position, rotation })

        objects.set(decorationId, object);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |zone| has been initialized. Their decorations will be loaded from the
    // database, and created in-game when found and appropriate.
    initializeZone(zone) {
        this.zones_.set(zone, new Map());
    }

    // Called when the area of the |zone| has been changed. Load their persistent objects from the
    // database to see if any missing ones should be added again, and make sure that existing ones
    // that now fall outside of the zone are removed.
    updateZone(zone) {

    }

    // Called when the |zone| has been deleted. All their objects will be invalidated immediately.
    deleteZone(zone) {
        const objects = this.zones_.get(zone);
        if (!objects)
            return;  // this |zone| does not have state
        
        for (const object of objects.values())
            object.dispose();

        this.zones_.delete(zone);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.entities_.dispose();
        this.entities_ = null;
    }
}
