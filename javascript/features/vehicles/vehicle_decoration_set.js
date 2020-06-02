// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ScopedEntities from 'entities/scoped_entities.js';

// This class contains the objects to be added for a specific vehicle and keeps the state of
// on what vehicles the objects have been added.
export class VehicleDecorationSet {
    // A map of which vehicle has what scoped entities
    vehicleObjects_ = null;

    // The objects to be added on the vehicle;
    objects_ = null;
    // Model of the vehicle where it has to be added t.
    vehicleModelId_ = null;

    // Message text draws
    enterMessage_ = null;
    announceMessage_ = null;

    constructor(filename) {
        this.objects_ = new Set();
        this.vehicleObjects_ = new Map();

        const structure = JSON.parse(readFile(filename));
        if (structure.hasOwnProperty('objects') && Array.isArray(structure.objects))
            this.loadObjects(structure.objects);

        this.vehicleModelId_ = structure.modelId;
        this.enterMessage_ = structure.enterMessage;
        this.announceMessage_ = structure.announceMessage;
    }

    get modelId() { return this.vehicleModelId_; }

    // ---------------------------------------------------------------------------------------------

    // Validates and loads all the |objects| to the local |objects_| set.
    loadObjects(objects) {
        for (const object of objects) {
            if (!object.hasOwnProperty('modelId'))
                throw new Error('Each object must define its model Id.');

            if (!object.hasOwnProperty('position') || !Array.isArray(object.position))
                throw new Error('Each object must define its position vector.');

            if (!object.hasOwnProperty('rotation') || !Array.isArray(object.rotation))
                throw new Error('Each object must define its rotation vector.');

            this.objects_.add({
                modelId: object.modelId,
                position: new Vector(...object.position),
                rotation: new Vector(...object.rotation),
            });
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Add the objects to the |vehicleId|
    enable(vehicleId) {
        if (this.vehicleObjects_.has(vehicleId))
            return;  // the set has already been enabled

        const entities = new ScopedEntities({ interiorId: 0, virtualWorld: 0 });
        this.vehicleObjects_.set(vehicleId, entities);

        // Create all the objects that are part of this decoration set.
        for (const { modelId, position, rotation } of this.objects_) {
            const object = entities.createObject({ modelId, position, rotation });
            pawnInvoke('AttachObjectToVehicle', 'iiffffff', object.id, vehicleId, position.x,
                position.y, position.z, rotation.x, rotation.y, rotation.z)
        }
    }

    // Remove the objects from the |vehicleId|
    disable(vehicleId) {
        if (!this.vehicleObjects_.has(vehicleId))
            return;  // this vehicle has no objects.

        const entities = this.vehicleObjects_.get(vehicleId);
        entities.dispose();
        this.vehicleObjects_.delete(vehicleId);
    }

    // Remove all created objects.
    disableAll() {
        for (const key of this.vehicleObjects_.keys()) {
            this.disable(key);
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        for (const entities of this.vehicleObjects_.values()) {
            if (entities !== null) {
                entities.dispose();
                entities = null;
            }
        }
    }
}
