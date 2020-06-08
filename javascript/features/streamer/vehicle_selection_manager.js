// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ScopedEntities from 'entities/scoped_entities.js';

import { difference } from 'base/set_extensions.js';

// Responsible for selecting which vehicles should be created on the server. Takes input from the
// streamer, but also considers recent usage and other data about the vehicles.
export class VehicleSelectionManager {
    registry_ = null;
    settings_ = null;
    streamer_ = null;

    disposed_ = false;
    entities_ = null;
    vehicles_ = null;

    constructor(registry, settings, streamer) {
        this.registry_ = registry;
        this.settings_ = settings;
        this.streamer_ = streamer;

        // Create the ScopedEntities instance, bound to the main interior and Virtual World. When
        // we want the streamer to support other worlds, this needs adjustments in PlaygroundJS as
        // well as it currently ignores players who aren't in the outside world.
        this.entities_ = new ScopedEntities({ interiorId: 0, virtualWorld: 0 });

        // Map of the vehicles that exist on the server, keyed by StreamableVehicle, valued by the
        // Vehicle entity instance that was created for the vehicle.
        this.vehicles_ = new Map();
    }

    // ---------------------------------------------------------------------------------------------

    // Spinning method that takes input from the streamer at a configured interval, and calls the
    // `updateSelection()` method to start propagating the selection.
    async select() {
        while (!this.disposed_) {
            const results = await this.streamer_.stream();
            if (this.disposed_)
                break;  // |this| got disposed of whilst streaming was in progress
            
            // Updates the vehicle selection based on the selected results.
            this.updateSelection(new Set([ ...results ]));

            await wait(this.settings_().getValue('vehicles/streamer_interval_ms'));
        }
    }

    // Updates the vehicle selection based on the given |selection|. All the vehicles within the
    // array are guaranteed to be created, whereas not all vehicles will be deleted immediately.
    updateSelection(selection) {
        const existing = new Set(this.vehicles_.keys());

        const added = difference(selection, existing);
        const deleted = difference(existing, selection);

        for (const streamableVehicle of added)
            this.createVehicle(streamableVehicle);
        
        for (const streamableVehicle of deleted)
            this.deleteVehicle(streamableVehicle);
    }

    // ---------------------------------------------------------------------------------------------

    // Creates a Vehicle entity for the given |streamableVehicle| instance.
    createVehicle(streamableVehicle) {
        if (this.vehicles_.has(streamableVehicle))
            throw new Error(`The given streamable vehicle is already live: ${streamableVehicle}`);

        const vehicle = this.entities_.createVehicle({
            modelId: streamableVehicle.modelId,

            position: streamableVehicle.position,
            rotation: streamableVehicle.rotation,

            primaryColor: streamableVehicle.primaryColor,
            secondaryColor: streamableVehicle.secondaryColor,
            siren: streamableVehicle.siren,
        });

        this.vehicles_.set(streamableVehicle, vehicle);
    }

    // Deletes the Vehicle entity for the given |streamableVehicle| instance.
    deleteVehicle(streamableVehicle) {
        if (!this.vehicles_.has(streamableVehicle))
            throw new Error(`The given streamable vehicle is not live: ${streamableVehicle}`);
        
        const vehicle = this.vehicles_.get(streamableVehicle);
        if (!vehicle.isConnected())
            console.warning('[streamer][exception] Vehicle has already been destroyed: ' + vehicle);
        else
            vehicle.dispose();
        
        this.vehicles_.delete(streamableVehicle);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.disposed_ = true;

        this.vehicles_.clear();
        this.vehicles_ = null;

        this.entities_.dispose();
        this.entities_ = null;
    }
}
