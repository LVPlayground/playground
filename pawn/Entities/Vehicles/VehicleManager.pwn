// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The Vehicle Manager manages all vehicles in the gamemode. It'll keep track of the amount of
 * vehicles created, and is the entry point you're searching for when looking into how to create
 * or destroy vehicles you need.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class VehicleManager {
    // After how many seconds of no usage should a vehicle be respawned?
    const VehicleRespawnDelayInSeconds = 300;

    // How many vehicle models exist in Grand Theft Auto: San Andreas?
    const VehicleModelCount = 611 /** highest vehicle Id **/ - 400 /** lowest vehicle Id **/;

    // How many vehicle colors exist?
    const VehicleColorCount = 256;

    // How many vehicles have been created in the gamemode?
    new m_vehicleCount;

    /**
     * Create a new vehicle that should be spawned in the gamemode. This method will do all the
     * basic initializations required, and manages the primary positioning and location.
     *
     * If the default primary and secondary colors of a vehicle have been chosen, then we'll choose
     * a random color ourselves in the range of [128, 255]. SA-MP added a number of rather clear
     * colors in this range as of version 0.3x.
     *
     * @param modelId Model Id of the vehicle that should be used.
     * @param positionX X-coordinate of the position where it should spawn.
     * @param positionY Y-coordinate of the position where it should spawn.
     * @param positionZ Z-coordinate of the position where it should spawn.
     * @param rotation Rotation over the z-axis (angle) for its spawn position.
     * @param primaryColor Primary color to paint the vehicle in.
     * @param secondaryColor Secondary color the vehicle should be painted in.
     * @param interiorId Id of the interior Id to spawn the vehicle in.
     * @param worldId Id of the world that owns the vehicle.
     * @return integer Id of the vehicle that has been created, or Vehicle::InvalidId.
     */
    public createVehicle(modelId, Float: positionX, Float: positionY, Float: positionZ, Float: rotation, primaryColor = -1, secondaryColor = -1, interiorId = 0, worldId = 0) {
        if (primaryColor == -1)
            primaryColor = Math->random(128, 255);
        if (secondaryColor == -1)
            secondaryColor = Math->random(128, 255);

        new vehicleId = Vehicle::InvalidId;
        if (VehicleModel(modelId)->isStaticVehicle() == true)
            vehicleId = AddStaticVehicleExPrivate(modelId, positionX, positionY, positionZ, rotation, primaryColor, secondaryColor, VehicleRespawnDelayInSeconds);
        else
            vehicleId = CreateVehiclePrivate(modelId, positionX, positionY, positionZ, rotation, primaryColor, secondaryColor, VehicleRespawnDelayInSeconds);

        if (vehicleId == Vehicle::InvalidId)
            return vehicleId;

        // Increase the reference count for this vehicle's model, so we can accurately keep track
        // of how many vehicle models have been created on Las Venturas Playground.
        VehicleModel(modelId)->increaseReferenceCount();

        // If this vehicle is a remote controllable vehicle, we need to register it with the RC
        // vehicle manager to make sure players are able to enter it.
        if (VehicleModel(modelId)->isRemoteControllableVehicle() == true)
            RcVehicleManager->registerRemoteControllableVehicle(vehicleId);

        // Set up the correct environment for this vehicle.
        LinkVehicleToInterior(vehicleId, interiorId);
        SetVehicleVirtualWorld(vehicleId, worldId);

        // Initialize the vehicle itself with the information we received.
        Vehicle(vehicleId)->initialize(primaryColor, secondaryColor, interiorId);
        Vehicle(vehicleId)->setPositionAndRotation(positionX, positionY, positionZ, rotation);

        ++m_vehicleCount;

        return vehicleId;
    }

    /**
     * Remove a vehicle from Las Venturas Playground. This will also get rid of all settings and
     * information that was stored about it. Static vehicles may not be removed.
     *
     * @return boolean Were we able to remove the vehicle from the gamemode?
     */
    public bool: destroyVehicle(vehicleId) {
        if (Vehicle(vehicleId)->isValid() == false)
            return false;

        new modelId = Vehicle(vehicleId)->modelId();
        if (VehicleModel(modelId)->isStaticVehicle()) {
            // Whilst we cannot remove the vehicle from the gamemode right now, we can attempt to
            // remove it from the database --if it is persistent-- so it'll be gone after a restart.
            if (Vehicle(vehicleId)->isPersistent() == true)
                VehicleStorageManager->requestRemoveVehicle(vehicleId);

            return false;
        }

        // If a remote controllable vehicle is being destroyed, make sure to mark it as such so that
        // we won't try to find it anymore if any player tries to enter a vehicle.
        if (VehicleModel(modelId)->isRemoteControllableVehicle() == true)
            RcVehicleManager->removeRemoteControllableVehicle(vehicleId);

        // Inform the vehicle itself about it being destroyed, giving it a chance to update its
        // state in the database if it's a persistent vehicle.
        Vehicle(vehicleId)->onDestroyed();

        // Now destroy the actual vehicle, which removes it from the world.
        DestroyVehiclePrivate(vehicleId);

        --m_vehicleCount;

        return true;
    }

    /**
     * Retrieve the amount of vehicles that have been created in Las Venturas Playground. This
     * includes private vehicles and vehicles used by minigames.
     *
     * @return integer The number of vehicles created in Las Venturas Playground.
     */
    public inline vehicleCount() {
        return (m_vehicleCount);
    }
};
