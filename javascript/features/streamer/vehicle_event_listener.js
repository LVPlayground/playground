// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Class responsible for listening to vehicle-related events and informing the necessary objects of
// the mutations. This ensures that state propagates appropriately throughout the streamer.
export class VehicleEventListener {
    selectionManager_ = null;
    respawnManager_ = null;

    callbacks_ = null;

    constructor(selectionManager, respawnManager) {
        this.selectionManager_ = selectionManager;
        this.respawnManager_ = respawnManager;

        provideNative(
            'MarkVehicleMoved', 'i', VehicleEventListener.prototype.markVehicleMoved.bind(this));

        server.playerManager.addObserver(this);
        server.vehicleManager.addObserver(this);
    }

    // native MarkVehicleMoved(vehicleId);
    //
    // Marks the given |vehicleId| as having been moved by a player. This will cause the vehicle to
    // be scheduled for respawn after the configured period of time has passed.
    markVehicleMoved(vehicleId) {
        const vehicle = server.vehicleManager.getById(vehicleId);
        if (!vehicle)
            return 0;  // the |vehicleId| does not exist on the server, oddly

        const streamableVehicle = this.selectionManager_.getStreamableVehicle(vehicle);
        if (streamableVehicle && !vehicle.driver)
            this.respawnManager_.onVehicleMoved(streamableVehicle);
        
        return 0;
    }

    // ---------------------------------------------------------------------------------------------
    // PlayerManager events

    // Called when the given |player| has left the |vehicle|. If this is a vehicle managed by the
    // streamer, we reset the vehicle's respawn delay on this signal when it's emptied.
    onPlayerLeaveVehicle(player, vehicle) {
        const streamableVehicle = this.selectionManager_.getStreamableVehicle(vehicle);
        if (streamableVehicle && vehicle.occupantCount === 1)
            this.respawnManager_.onVehicleVacated(streamableVehicle);
    }

    // ---------------------------------------------------------------------------------------------
    // VehicleManager events

    // Called when the given |vehicle| has been destroyed. Different respawn times apply when a
    // vehicle has been destroyed, as it's just rubbish on the ground now.
    onVehicleDeath(vehicle) {
        const streamableVehicle = this.selectionManager_.getStreamableVehicle(vehicle);
        if (streamableVehicle)
            this.respawnManager_.onVehicleDeath(streamableVehicle);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        provideNative('MarkVehicleMoved', 'i', vehicleId => 0);

        server.vehicleManager.removeObserver(this);
        server.playerManager.removeObserver(this);
    }
}
