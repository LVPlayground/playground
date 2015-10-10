// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The Vehicle access manager controls whether a player will be allowed access to a vehicle or not.
 * Actual enforcement takes place at two times: first when the vehicle streams in for a player, at
 * which time we can control the locks, and again when someone tries to enter a vehicle.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class VehicleAccessManager {
    /**
     * Returns whether a certain player is allowed to access a certain vehicle. This method only
     * indicates whether they are or not, and does not do any enforcements by itself.
     *
     * @param playerId Id of the player who might want to access a vehicle.
     * @param vehicleId Id of the vehicle which they might want to access.
     */
    public bool: isPlayerAllowedInVehicle(playerId, vehicleId) {
        if (Vehicle(vehicleId)->isAdministratorVehicle() == true) {
            if (Player(playerId)->isAdministrator() == true)
                return true; // administrators can always access administrator vehicles.

            if (Player(playerId)->isVip() == true && PlayerSettings(playerId)->isAdminVehicleAccessDisabled() == false)
                return true; // VIPs have access to admin vehicles unless disabled.

            return false; // other players cannot access admin vehicles.
        }

        if (Vehicle(vehicleId)->isVeryImportantPlayerVehicle() == true) {
            if (Player(playerId)->isVip() == true || Player(playerId)->isAdministrator() == true)
                return true; // VIPs and administrators always have access to these vehicles.

            return false; // other players cannot access VIP vehicles.
        }

        return true; // by default everyone has access to every vehicle.
    }

    /**
     * When a player's vehicle access level changes, for example because they gain administrator
     * rights, we have to synchronize their access level so that vehicles immediately respond.
     *
     * @param playerId Id of the player to synchronize vehicle access for.
     */
    public synchronizePlayerVehicleAccess(playerId) {
        new playerCurrentVehicleId = GetPlayerVehicleID(playerId);
        for (new vehicleId = 0; vehicleId < MAX_VEHICLES; ++vehicleId) {
            if (Vehicle(vehicleId)->isValid() == false)
                continue; // the vehicle is not available in the world.

            if (Vehicle(vehicleId)->isAdministratorVehicle() == false && Vehicle(vehicleId)->isVeryImportantPlayerVehicle() == false)
                continue; // the vehicle does not have a modified access level.

            new bool: allowedInVehicle = this->isPlayerAllowedInVehicle(playerId, vehicleId);
            SetVehicleParamsForPlayer(vehicleId, playerId, 0, allowedInVehicle ? 0 /** unlocked **/ : 1 /** locked **/);

            // If the player is currently in this vehicle, we need to remove them from it.
            if (playerCurrentVehicleId == vehicleId && allowedInVehicle == false)
                this->denyPlayerVehicleAccess(playerId);
        }
    }

    /**
     * When a vehicle's access level changes, we want to be sure that only the players who are allowed
     * to access it can actually access it. Therefore we iterate over the players to update all the
     * relevant settings, and lock the doors for them if they can't enter it anymore.
     *
     * @param vehicleId Id of the vehicle which' permission mask has changed.
     */
    public synchronizeAccessForVehicle(vehicleId) {
        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
            if (Player(playerId)->isConnected() == false || Player(playerId)->isNonPlayerCharacter())
                continue; // the player isn't connected, or is a non-player character.

            if (!IsVehicleStreamedIn(vehicleId, playerId))
                continue; // the player doesn't know about the vehicle.

            new bool: allowedInVehicle = this->isPlayerAllowedInVehicle(playerId, vehicleId);
            SetVehicleParamsForPlayer(vehicleId, playerId, 0, allowedInVehicle ? 0 /** unlocked **/ : 1 /** locked **/);

            // If the player is currently in this vehicle, we need to remove them from it.
            if (IsPlayerInAnyVehicle(playerId) && GetPlayerVehicleID(playerId) == vehicleId && allowedInVehicle == false)
                this->denyPlayerVehicleAccess(playerId);
        }
    }

    /**
     * Denies a player access from the vehicle they're (trying to) enter. If they already are in
     * the vehicle then remove them from it, otherwise cancel their animations. In both cases we
     * re-set them to their current position, which resets plenty of other state.
     *
     * @param playerId Id of the player who tried to enter a vehicle.
     */
    public denyPlayerVehicleAccess(playerId) {
        if (IsPlayerInAnyVehicle(playerId))
            RemovePlayerFromVehicle(playerId);
        else
            ClearAnimations(playerId, 1);

        new Float: position[3];
        GetPlayerPos(playerId, position[0], position[1], position[2]);
        SetPlayerPos(playerId, position[0], position[1], position[2]);

        ShowBoxForPlayer(playerId, "This vehicle is only accessible by VIPs. Check out ~r~/donate~w~!");
    }
};
