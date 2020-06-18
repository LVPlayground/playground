// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { ScopedEntities } from 'entities/scoped_entities.js';
import { VehicleEventListener } from 'features/streamer/vehicle_event_listener.js';
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
    events_ = null;
    maxVisible_ = null;
    respawnManager_ = null;
    streamableVehicles_ = null;
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
        this.respawnManager_ = new VehicleRespawnManager(settings);

        // Listens to vehicle-related events on behalf of the manager, and propagates the events
        // throughout the streamer as deemed appropriate.
        this.events_ = new VehicleEventListener(this, this.respawnManager_);

        // Stores the maximum number of vehicles that can be created on the server at once.
        this.maxVisible_ = settings().getValue('vehicles/streamer_max_visible');

        // Map of the StreamableVehicles that have live representations, keyed by the entity.
        this.streamableVehicles_ = new Map();

        // Map of the vehicles that exist on the server, keyed by StreamableVehicle, valued by the
        // Vehicle entity instance that was created for the vehicle.
        this.vehicles_ = new Map();

        // Map of vehicles that have been cached, to reduce churn of vehicles that exist on the
        // server, since there's not always a need for all thousand vehicles to exist.
        this.vehicleCache_ = new Map();
    }

    // Gets the total number of vehicles that have been created on the server.
    get liveVehicles() { return this.streamableVehicles_.size; }

    // Gets the number of vehicles that are currently within streaming range.
    get streamedVehicles() { return this.vehicles_.size; }

    // Gets the number of vehicles that have been cached to reduce server churn.
    get cachedVehicles() { return this.vehicleCache_.size; }

    // Gets the total number of vehicles that are currently on the respawn queue.
    get respawnQueueVehicles() { return this.respawnManager_.size; }

    // Gets the StreamableVehicle instance for the given |vehicle|. We require the |vehicle| to be
    // a streamed-in vehicle for this function to return the instance, to ensure that |this| and
    // the VehicleRespawnManager stay in sync.
    getStreamableVehicle(vehicle) {
        const streamableVehicle = this.streamableVehicles_.get(vehicle);
        return this.vehicles_.has(streamableVehicle) ? streamableVehicle : null;
    }

    // ---------------------------------------------------------------------------------------------

    // Spinning method that takes input from the streamer at a configured interval, and calls the
    // `updateSelection()` method to start propagating the selection.
    async select() {
        while (!this.disposed_) {
            const results = await this.streamer_.stream();
            if (this.disposed_)
                break;  // |this| got disposed of whilst streaming was in progress

            // Updates the vehicle selection based on the selected results. This is done in a try/
            // catch block because issues shouldn't be fatal for vehicles on the server.
            try {
                this.updateSelection(new Set([ ...results ]));
            } catch (exception) {
                console.log(exception);
            }

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

            this.deleteVehicle(streamableVehicle, /* immediate= */ false);
        }

        for (const streamableVehicle of respawnables) {
            if (deleted.has(streamableVehicle))
                continue;  // the |streamableVehicle| has been deleted already

            this.respawnVehicle(streamableVehicle);
        }
    }

    // ---------------------------------------------------------------------------------------------

    // Creates a Vehicle entity for the given |streamableVehicle| instance. It's possible that the
    // |streamableVehicle| still exists as part of the vehicle cache, in which case it will recover.
    createVehicle(streamableVehicle) {
        if (this.vehicles_.has(streamableVehicle))
            throw new Error(`The given streamable vehicle is already live: ${streamableVehicle}`);

        // Recover the |streamableVehicle| from the vehicle cache if it lives there.
        if (this.vehicleCache_.has(streamableVehicle)) {
            const vehicle = this.vehicleCache_.get(streamableVehicle);

            this.vehicleCache_.delete(streamableVehicle);
            this.vehicles_.set(streamableVehicle, vehicle);
            return;
        }

        // Otherwise create the vehicle on the server through our ScopedEntities.
        const vehicle = this.entities_.createVehicle({
            modelId: streamableVehicle.modelId,

            position: streamableVehicle.position,
            rotation: streamableVehicle.rotation,

            paintjob: streamableVehicle.paintjob,
            primaryColor: streamableVehicle.primaryColor,
            secondaryColor: streamableVehicle.secondaryColor,
            numberPlate: streamableVehicle.numberPlate,
            siren: streamableVehicle.siren,

            respawnDelay: -1,  // we handle respawns manually
        });

        streamableVehicle.setLiveVehicle(vehicle);

        this.streamableVehicles_.set(vehicle, streamableVehicle);
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
            this.deleteVehicle(streamableVehicle, /* immediate= */ true);
        else
            vehicle.respawn();
    }

    // Indicates that the given |streamableVehicle| should be deleted. If the |immediate| flag is
    // set, it will be deleted immediately, otherwise it might be added to the vehicle cache to
    // minimize vehicle churn on the server.
    deleteVehicle(streamableVehicle, immediate) {
        if (!this.vehicles_.has(streamableVehicle))
            throw new Error(`The given streamable vehicle is not live: ${streamableVehicle}`);
        
        if (this.respawnManager_.has(streamableVehicle))
            throw new Error(`The streamable vehicle has been pinned by the respawn manager.`);
        
        const vehicle = this.vehicles_.get(streamableVehicle);

        // If the |streamableVehicle| is eligible to be cached, move it to the vehicle cache instead
        // of being deleted immediately. This reduces churn on the server.
        if (streamableVehicle.isPersistent() && !immediate) {
            const limit = this.maxVisible_ + this.respawnManager_.size;

            // If the number of |created| vehicles is equal to or above the |limit|, we delete the
            // oldest cached vehicle(s) to make space for the |streamableVehicle|. This uses the
            // fact that entries in JavaScript's Map are stored in insertion order, thus LRU.
            for (const cacheEntry of this.vehicleCache_) {
                if (this.streamableVehicles_.size <= limit)
                    break;

                this.deleteVehicleInternal(cacheEntry[0], cacheEntry[1]);
            }

            // Now store the |streamableVehicle| in the Map if there's space, where it'll be set as
            // the most recently used entry, and remove it from the map of streamed vehicles.
            if (this.streamableVehicles_.size <= limit) {
                this.vehicleCache_.set(streamableVehicle, vehicle);
                this.vehicles_.delete(streamableVehicle);
                return;
            }
        }

        this.deleteVehicleInternal(streamableVehicle, vehicle);
    }

    // Deletes the given |streamableVehicle|, represented by the |vehicle| from all sources, which
    // includes the vehicle cache. Lenient with vehicles that may've been deleted elsewhere.
    deleteVehicleInternal(streamableVehicle, vehicle) {
        if (!vehicle.isConnected()) {
            console.warning('[streamer][exception] Vehicle has already been destroyed: ' + vehicle);
        } else {
            for (const player of vehicle.getOccupants())
                player.leaveVehicle();

            vehicle.dispose();
        }

        if (streamableVehicle.isEphemeral())
            this.registry_.deleteVehicle(streamableVehicle);

        streamableVehicle.setLiveVehicle(null);

        this.streamableVehicles_.delete(vehicle);

        this.vehicles_.delete(streamableVehicle);
        this.vehicleCache_.delete(streamableVehicle);
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

        if (this.vehicles_.has(streamableVehicle)) {
            this.deleteVehicle(streamableVehicle, /* immediate= */ true);
        } else if (this.vehicleCache_.has(streamableVehicle)) {
            this.deleteVehicleInternal(
                streamableVehicle, this.vehicleCache_.get(streamableVehicle));
        }
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.disposed_ = true;

        this.vehicles_.clear();
        this.vehicles_ = null;

        this.streamableVehicles_.clear();
        this.streamableVehicles_ = null;

        this.respawnManager_.dispose();
        this.respawnManager_ = null;

        this.events_.dispose();
        this.events_ = null;

        this.entities_.dispose();
        this.entities_ = null;
    }
}
