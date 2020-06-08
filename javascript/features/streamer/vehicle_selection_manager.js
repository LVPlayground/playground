// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import ScopedEntities from 'entities/scoped_entities.js';
import { VehicleRespawnManager } from 'features/streamer/vehicle_respawn_manager.js';

import { difference } from 'base/set_extensions.js';

// Responsible for selecting which vehicles should be created on the server. Takes input from the
// streamer, but also considers recent usage and other data about the vehicles.
export class VehicleSelectionManager {
    registry_ = null;
    settings_ = null;
    streamer_ = null;

    disposed_ = false;
    entities_ = null;
    respawnManager_ = null;
    vehicles_ = null;

    constructor(registry, settings, streamer) {
        this.registry_ = registry;
        this.settings_ = settings;
        this.streamer_ = streamer;

        // Create the ScopedEntities instance, bound to the main interior and Virtual World. When
        // we want the streamer to support other worlds, this needs adjustments in PlaygroundJS as
        // well as it currently ignores players who aren't in the outside world.
        this.entities_ = new ScopedEntities({ interiorId: 0, virtualWorld: 0 });

        // Responsible for managing vehicles that have been used by players, which should not be
        // respawned by the streamer when they go out of scope.
        this.respawnManager_ = new VehicleRespawnManager();

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

            // Wait for the interval period again before repeating this dance.
            await wait(this.settings_().getValue('vehicles/streamer_interval_ms'));
        }
    }

    // Updates the vehicle selection based on the given |selection|. All the vehicles within the
    // array are guaranteed to be created, whereas not all vehicles will be deleted immediately.
    updateSelection(selection) {
        const respawnables = this.respawnManager_.getVehiclesToRespawn();

        const existing = new Set(this.vehicles_.keys());

        const added = difference(selection, existing);
        const deleted = difference(existing, selection);

        for (const streamableVehicle of added)
            this.createVehicle(streamableVehicle);

        for (const streamableVehicle of deleted) {
            if (this.respawnManager_.has(streamableVehicle))
                continue;  // the |streamableVehicle| is being kept alive by the respawn manager

            this.deleteVehicle(streamableVehicle);
        }

        for (const streamableVehicle of respawnables) {
            if (deleted.has(streamableVehicle))
                continue;  // the |streamableVehicle| has been deleted already

            this.respawnVehicle(streamableVehicle);
        }
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

        streamableVehicle.setLiveVehicle(vehicle);

        this.vehicles_.set(streamableVehicle, vehicle);
    }

    // Requests for the |streamableVehicle| to respawn. Ephemeral vehicles will be deleted straight
    // away, whereas other vehicles will be requested to respawn.
    respawnVehicle(streamableVehicle) {
        if (!this.vehicles_.has(streamableVehicle))
            throw new Error(`The given streamable vehicle is not live: ${streamableVehicle}`);

        const vehicle = this.vehicles_.get(streamableVehicle);

        // If this vehicle is ephemeral, delete it straight away.
        if (streamableVehicle.isEphemeral())
            this.deleteVehicle(streamableVehicle);
        else
            vehicle.respawn();
    }

    // Deletes the Vehicle entity for the given |streamableVehicle| instance. If the vehicle is
    // ephemeral, it will further be deleted from the VehicleRegistry as well.
    deleteVehicle(streamableVehicle) {
        if (!this.vehicles_.has(streamableVehicle))
            throw new Error(`The given streamable vehicle is not live: ${streamableVehicle}`);
        
        if (this.respawnManager_.has(streamableVehicle))
            throw new Error(`The streamable vehicle has been pinned by the respawn manager.`);
        
        const vehicle = this.vehicles_.get(streamableVehicle);
        if (!vehicle.isConnected())
            console.warning('[streamer][exception] Vehicle has already been destroyed: ' + vehicle);
        else
            vehicle.dispose();

        if (streamableVehicle.isEphemeral())
            this.registry_.deleteVehicle(streamableVehicle);

        streamableVehicle.setLiveVehicle(null);

        this.vehicles_.delete(streamableVehicle);
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the given |streamableVehicle| should be created on the server immediately. This
    // will register as if the vehicle's latest use time is right now.
    requestCreateVehicle(streamableVehicle) {
        if (!this.vehicles_.has(streamableVehicle))
            this.createVehicle(streamableVehicle);
        
        this.respawnManager_.add(streamableVehicle);
    }

    // Called when the given |streamableVehicle| is being removed from the server. Will remove any
    // live vehicles tied to it from the server as well.
    requestDeleteVehicle(streamableVehicle) {
        if (this.respawnManager_.has(streamableVehicle))
            this.respawnManager_.delete(streamableVehicle);

        if (this.vehicles_.has(streamableVehicle))
            this.deleteVehicle(streamableVehicle);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.disposed_ = true;

        this.vehicles_.clear();
        this.vehicles_ = null;

        this.respawnManager_.dispose();
        this.respawnManager_ = null;

        this.entities_.dispose();
        this.entities_ = null;
    }
}
