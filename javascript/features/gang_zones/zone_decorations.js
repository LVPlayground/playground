// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.
// @ts-check

import ScopedEntities from 'entities/scoped_entities.js';
import { ZoneDecorationRegistry } from 'features/gang_zones/zone_decoration_registry.js';

// Responsible for managing decorations that gangs have added to their zones. They are able to add
// as many objects are they want (within reasonable boundaries), but each object has to be paid for
// at a configured interval. Decoration management can be started through the "/zone" command.
export class ZoneDecorations {
    database_ = null;
    entities_ = null;
    registry_ = null;
    zones_ = null;

    constructor(database) {
        this.database_ = database;
        this.registry_ = new ZoneDecorationRegistry();
        this.zones_ = new Map();

        this.entities_ = new ScopedEntities({
            interiorId: 0,
            virtualWorld: 0,
        });
    }

    // Gets the registry that contains all the decorations available to gangs.
    get registry() { return this.registry_; }

    // ---------------------------------------------------------------------------------------------

    // Gets an iterator with the objects created for the given |zone|, or undefined.
    getObjectsForZone(zone) { return this.zones_.get(zone); }

    // ---------------------------------------------------------------------------------------------

    // Creates the described object for the given |zone|. It will be written to the database, to
    // make sure that the object will continue to appear in subsequent playing sessions.
    async createObject(zone, modelId, position, rotation) {
        if (!this.zones_.has(zone))
            throw new Error(`Requested to create an object for an unknown zone: ${zone}`);

        const decorationId =
            await this.database_.createDecoration(zone.gangId, modelId, position, rotation);

        if (!decorationId)
            return;  // the decoration could not be stored in the database

        this.internalCreateObject(
            this.zones_.get(zone), decorationId, modelId, position, rotation);
        
        return decorationId;
    }

    // Deletes the object having |decorationId| owned by the |zone| from the database, as well as
    // its in-game representation, with immediate effect.
    async removeObject(zone, decorationId) {
        if (!this.zones_.has(zone))
            throw new Error(`Requested to create an object for an unknown zone: ${zone}`);
        
        const objects = this.zones_.get(zone);
        if (!objects.has(decorationId))
            throw new Error(`The decoration (Id:${decorationId}) does not exist for this zone.`);
        
        const object = objects.get(decorationId);

        objects.delete(decorationId);
        object.dispose();

        await this.database_.removeDecoration(zone.gangId, decorationId);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |zone| has been initialized. Their decorations will be loaded from the
    // database, and created in-game when found and appropriate.
    initializeZone(zone) {
        this.zones_.set(zone, new Map());

        return this.database_.loadDecorationsForZone(zone).then(decorations => {
            if (!this.zones_ || !this.zones_.has(zone))
                return;  // the ZoneDecorations or individual zone got disposed of
            
             const objects = this.zones_.get(zone);
             for (const { decorationId, modelId, position, rotation } of decorations)
                this.internalCreateObject(objects, decorationId, modelId, position, rotation);
        });
    }

    // Called when the area of the |zone| has been changed. Load their persistent objects from the
    // database to see if any missing ones should be added again, and make sure that existing ones
    // that now fall outside of the zone are removed.
    updateZone(zone) {
        if (!this.zones_.has(zone))
            return;  // this |zone| does not have state
        
        return this.database_.loadDecorationsForZone(zone).then(decorations => {
            if (!this.zones_ || !this.zones_.has(zone))
                return;  // the ZoneDecorations or individual zone got disposed of

            const seenDecorationIds = new Set();

            const objects = this.zones_.get(zone);

            // (1) Make sure that everything in |decorations| has been created.
            for (const { decorationId, modelId, position, rotation } of decorations) {
                seenDecorationIds.add(decorationId);

                if (objects.has(decorationId))
                    continue;  // the object already exists
                
                this.internalCreateObject(objects, decorationId, modelId, position, rotation);
            }

            // (2) Make sure that everything that's not in |decorations| has been removed.
            for (const [ decorationId, object ] of objects) {
                if (seenDecorationIds.has(decorationId))
                    continue;  // the object should still exist
                
                objects.delete(decorationId);
                object.dispose();
            }
        });
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

    // Creates the actual entity for the described object, and stores it in the |objects| map.
    internalCreateObject(objects, decorationId, modelId, position, rotation) {
        const object = this.entities_.createObject({ modelId, position, rotation });

        objects.set(decorationId, object);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.entities_.dispose();
        this.entities_ = null;

        this.zones_.clear();
        this.zones_ = null;
    }
}
