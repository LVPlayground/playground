// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * There's a lot which can happen to a vehicle: they can spawn, blow up, get different colors and
 * paint jobs, and so on. We need to catch these events and forward them to the appropriate systems.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class VehicleEvents <vehicleId (MAX_VEHICLES)> {
    /**
     * This method gets invoked when a player resprays a vehicle with new colors in a modification
     * shop. As of SA-MP 0.3x, this method does not get invoked for Pay 'n Spray shops.
     *
     * @param playerId Id of the player who has been modifying this vehicle.
     * @param primaryColor The primary color which they want this vehicle to have.
     * @param secondaryColor The secondary color which they want this vehicle to have.
     */
    public onVehicleRespray(playerId, primaryColor, secondaryColor) {
        // Don't set color or give out money in the case of no colorchanges
        new previousPrimaryColor = Vehicle(vehicleId)->primaryColor(),
            previousSecondaryColor = Vehicle(vehicleId)->secondaryColor();

        if (previousPrimaryColor == primaryColor && previousSecondaryColor == secondaryColor)
            return false;

        // Update the vehicle's color internally so we stay synchronized.
        Vehicle(vehicleId)->setColors(primaryColor, secondaryColor);

        // If any player owns the vehicle modification property, give them money.
        PropertyEvents->onVehicleModified();

        return 1;
        #pragma unused playerId
    }

    /**
     * Players can change the paintjobs associated with their vehicles in many mod shops. Which shop
     * that is depends on the vehicle, but every new paint job ends up here. There's a few things we
     * need to do in order to keep features synchronized.
     *
     * @param playerId Id of the player who's changed the vehicle's paintjob.
     * @param paintjobId Id of the paintjob which the vehicle now has.
     */
    public onVehiclePaintjob(playerId, paintjobId) {
        // Update the vehicle's paintjob internally so we stay synchronized.
        Vehicle(vehicleId)->setPaintJob(paintjobId);

        // If any player owns the vehicle modification property, give them money.
        PropertyEvents->onVehicleModified();

        return 1;
        #pragma unused playerId
    }

    /**
     * Players also have the ability to change other parts of their vehicle, for example the wheels,
     * engine or add nitrogen. We need to do a few things in these cases as well.
     *
     * @param playerId Id of the player who modified their vehicle.
     * @param componentId Id of the component which was added to the vehicle.
     * @return boolean Whether we should allow this modification.
     */
    public bool: onVehicleMod(playerId, componentId) {
        // Determine whether the applied modification is valid for this vehicle. If it's not, we
        // have to block synchronization of this mod in order to prevent people from crashing.
        if (VehicleModel(GetVehicleModel(vehicleId))->isValidComponent(componentId) == false)
            return false;

        // If any player owns the vehicle modification property, give them money.
        PropertyEvents->onVehicleModified();

        CCrush__Modify(vehicleId);

        return true;
        #pragma unused playerId, componentId
    }

    /**
     * Vehicles can be submerged in water or explode, both of which will trigger the onVehicleDeath()
     * event to fire. A number of features may rely on this for closing off any loose ends.
     */
    public onVehicleDeath() {
        CBomb__VehicleDeath(vehicleId);
        CShell__VehicleDeath(vehicleId);
        CRobbery__VehicleDeath(vehicleId);
        CTheft__OnVehicleDeath(vehicleId);
        CCrush__Reset(vehicleId);
        CLyse__VehicleDeath(vehicleId);
        CMap__VehicleDeath(vehicleId);

        return 1;
    }

    /**
     * Just like players, vehicles have statuses which allow them to be "wasted" (invisible and
     * respawning) and spawned. When they're just created or when they die, for example due to an
     * explosion or because it's being respawned, they will respawn.
     */
    public onVehicleSpawn() {
        CBomb__ResetVehicleData(vehicleId);
        CCrush__Reset(vehicleId);

        // Remove vehicles created with /v create which have not been saved yet.
        if (Vehicle(vehicleId)->isOpenWorldVehicle() == true) {
            VehicleManager->destroyVehicle(vehicleId);
            return 1;
        }

        // Since SA:MP might respawn the vehicle at an old position, set the vehicle at its currently
        // saved position and rotation.
        new Float: savedPosition[4];
        Vehicle(vehicleId)->getPositionAndRotation(savedPosition[0], savedPosition[1],
            savedPosition[2], savedPosition[3]);

        SetVehiclePos(vehicleId, savedPosition[0], savedPosition[1], savedPosition[2]);
        SetVehicleZAngle(vehicleId, savedPosition[3]);

        // Reset the vehicle's saved color and paintjob.
        ChangeVehicleColor(vehicleId, Vehicle(vehicleId)->primaryColor(), Vehicle(vehicleId)->secondaryColor());
        ChangeVehiclePaintjob(vehicleId, Vehicle(vehicleId)->paintJob());

        // Place the vehicle in the correct interior and world.
        LinkVehicleToInterior(vehicleId, Vehicle(vehicleId)->interiorId());
        SetVehicleVirtualWorld(vehicleId, 0 /* World::MainWorld */);

        // Further handling for other features.
        CShell__VehicleSpawn(vehicleId);
        CTheft__VehicleSpawn(vehicleId);
        CLyse__VehicleSpawn(vehicleId);
        CMap__VehicleSpawn(vehicleId);

        return 1;
    }

    /**
     * Vehicles are being streamed by the SA-MP server, and are not always sending data to every
     * player connected to the server. When a vehicle becomes in range for a player, this method
     * gets called. This is the place to update certain dynamics for the vehicle.
     *
     * @param playerId Id of the player for whom this vehicle became in-range.
     */
    public onVehicleStreamIn(playerId) {
        CLyse__OnVehicleStreamIn(vehicleId, playerId);

        new bool: vehicleOccupied = false;
        for (new otherPlayerId = 0; otherPlayerId <= PlayerManager->highestPlayerId(); ++otherPlayerId) {
            if (Player(otherPlayerId)->isConnected() == false)
                continue; // the player isn't connected to the server.

            if (IsPlayerInVehicle(otherPlayerId, vehicleId)) {
                vehicleOccupied = true;
                break;
            }
        }

        new vehicleModelId = GetVehicleModel(vehicleId), vehiclePoolSize = GetVehiclePoolSize(),
            bool: isTrailerAndAttached = false;
        if (VehicleModel->isTrailer(vehicleModelId)) {
            for (new otherVehicleId = 0; otherVehicleId <= vehiclePoolSize; ++otherVehicleId) {
                if (GetVehicleTrailer(otherVehicleId) == vehicleId) {
                    isTrailerAndAttached = true;
                    break;
                }
            }            
        }

        new Float: vehicleSpawnPosition[4], Float: vehicleCurrentZAngle;
        Vehicle(vehicleId)->getPositionAndRotation(vehicleSpawnPosition[0], vehicleSpawnPosition[1],
            vehicleSpawnPosition[2], vehicleSpawnPosition[3]);
        GetVehicleZAngle(vehicleId, vehicleCurrentZAngle);

        // Check if empty vehicle is within 5 meter(?) of his spawnposition
        if (GetVehicleDistanceFromPoint(vehicleId, vehicleSpawnPosition[0],
                vehicleSpawnPosition[1],
                vehicleSpawnPosition[2]) <= 2.0 &&
            vehicleCurrentZAngle != vehicleSpawnPosition[3] &&
            (vehicleOccupied == false || GetVehicleTrailer(vehicleId) == 0) && 
            isTrailerAndAttached == false) {
            SetVehicleZAngle(vehicleId, vehicleSpawnPosition[3]);
        }

        Annotation::ExpandList<OnVehicleStreamIn>(vehicleId, playerId);
        return 1;
    }
};

// -------------------------------------------------------------------------------------------------

// Foward the actual events to the VehicleEvents class.
public OnVehicleRespray(playerid, vehicleid, color1, color2) {
    if (Player(playerid)->isConnected() == false || Player(playerid)->isNonPlayerCharacter() == true
        || Vehicle(vehicleid)->isValid() == false)
        return 0; // don't handle invalid players, NPCs or invalid vehicles.

    VehicleEvents(vehicleid)->onVehicleRespray(playerid, color1, color2);
    return 1;
}

public OnVehiclePaintjob(playerid, vehicleid, paintjobid) {
    if (Player(playerid)->isConnected() == false || Player(playerid)->isNonPlayerCharacter() == true
        || Vehicle(vehicleid)->isValid() == false)
        return 0; // don't handle invalid players, NPCs or invalid vehicles.

    VehicleEvents(vehicleid)->onVehiclePaintjob(playerid, paintjobid);
    return 1;
}

public OnVehicleMod(playerid, vehicleid, componentid) {
    if (Player(playerid)->isConnected() == false || Player(playerid)->isNonPlayerCharacter() == true)
        return 0; // don't handle invalid players or NPCs

    if (Vehicle(vehicleid)->isValid() == false)
        return 0; // don't handle invalid vehicles

    if (!IsLegalModification(vehicleid, componentid)) {
        new message[128];

        format(message, sizeof(message), "%s (Id:%d) made an illegal vehicle modification with component %d.",
            Player(playerid)->nicknameString(), playerid, componentid);
        Admin(playerid, message);

        // Kick them from Las Venturas Playground
        Player(playerid)->kick("Illegal vehicle modification");

        return 0; // don't handle illegal modifications
    }

    return _: VehicleEvents(vehicleid)->onVehicleMod(playerid, componentid);
}

public OnVehicleDeath(vehicleid, killerid) {
    if (Vehicle(vehicleid)->isValid() == false)
        return 0; // don't handle invalid vehicles.

    Annotation::ExpandList<OnVehicleDeath>(vehicleid);

    VehicleEvents(vehicleid)->onVehicleDeath();
    return 1;
    #pragma unused killerid
}

public OnVehicleSpawn(vehicleid) {
    if (Vehicle(vehicleid)->isValid() == false)
        return 0; // don't handle invalid vehicles.

    Annotation::ExpandList<OnVehicleSpawn>(vehicleid);

    VehicleEvents(vehicleid)->onVehicleSpawn();
    return 1;
}

public OnVehicleStreamIn(vehicleid, forplayerid) {
    if (Player(forplayerid)->isConnected() == false || Player(forplayerid)->isNonPlayerCharacter() == true
        || Vehicle(vehicleid)->isValid() == false)
        return 0; // don't handle invalid players, NPCs or invalid vehicles.

    VehicleEvents(vehicleid)->onVehicleStreamIn(forplayerid);
    return 1;
}
