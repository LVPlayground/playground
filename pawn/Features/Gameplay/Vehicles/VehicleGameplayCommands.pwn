// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

#if Feature::DisableRaces == 1

CRace__IsRacing(playerId) {
    return playerId != 9001 ? 0 : 1;
}

#endif

/**
 * Grand Theft Auto is a game all about driving about in all sorts of vehicles. Since nobody is
 * perfect stuff tends to happen to those vehicles which could eventually lead to it exploding or
 * worse. This class holds the commands availible to them.
 *
 * @author Joeri de Graaf <oostcoast@sa-mp.nl>
 */
class VehicleGameplayCommands {
    /**
     * Allowes administrators, participants of cruises or players in a map zone to fix their vehicle.
     * Administrators are allowed to pass a player parameter to fix their vehicle.
     *
     * @param playerId Id of the player who executed this command.
     * @param player Name or Id of a player to fix the car for. Optional.
     * @command /vr [player]?
     */
    @command("vr")
    public onVehicleRepairCommand(playerId, params[]) {
        new targetPlayerId = playerId,
            targetVehicleId = Vehicle::InvalidId;

        if (Command->parameterCount(params) >= 1 && Player(playerId)->isAdministrator() == true) {
            targetPlayerId = Command->playerParameter(params, 0, playerId);
            if (targetPlayerId == Player::InvalidId)
                return 1;

            if (GetPlayerState(targetPlayerId) != PLAYER_STATE_DRIVER) {
                ShowBoxForPlayer(playerId, "This player isn't driving any vehicle.");
                return 1;
            }
        }

        if (!IsPlayerInAnyVehicle(targetPlayerId)) {
            ShowBoxForPlayer(playerId, "You need to be in a vehicle in order to repair it.");
            return 1;
        }

        targetVehicleId = GetPlayerVehicleID(targetPlayerId);
        if (Player(playerId)->isAdministrator() == false) {
            if (!CRace__IsRacing(targetPlayerId) && CruiseController->isCruiseActive() == false && !IsPlayerInMapZone(targetPlayerId)) {
                ShowBoxForPlayer(playerId, "You are only allowed to repair your vehicle during cruises, races or in map zones.");
                return 1;
            }

            if (!CRace__IsRacing(targetPlayerId) && !IsPlayerInMapZone(targetPlayerId) && CruiseController->isCruiseActive() == true) {
                if (CruiseController->isCruiseInsideLasVenturas() == true) {
                    ShowBoxForPlayer(playerId, "You can't fix your vehicle while the cruise is in Las Venturas.");
                    return 1;
                }

                if (CruiseController->isPlayerNearCruiseLeader(targetPlayerId) == false) {
                    ShowBoxForPlayer(playerId, "You can't use this command if you are too far away from the cruise leader.");
                    return 1;
                }
            }
        }

        // Everything must be ok, lets fix the vehicle and notify the player.
        SetVehicleHealth(targetVehicleId, 1000.0);
        RepairVehicle(targetVehicleId);

        ShowBoxForPlayer(playerId, "The vehicle has been repaired!");

        return 1;
    }
    /**
     * Allowes administrators, participants of cruises or player in a map zone to flip their vehicle.
     * Administrators and above are allowed to pass a player name/Id to flip someones vehicle.
     *
     * @param playerId Id of the player who executed this command.
     * @param player Name or Id of a player to flip the car for. Optional.
     * @command /flip [player]?
     */
    @command("flip")
    public onFlipCommand(playerId, params[]) {
        new targetPlayerId = playerId,
            targetVehicleId = GetPlayerVehicleID(targetPlayerId);

        if (Command->parameterCount(params) >= 1 && Player(playerId)->isAdministrator() == true) {
            targetPlayerId = Command->playerParameter(params, 0, playerId);
            if (targetPlayerId == Player::InvalidId)
                return 1;

            if (GetPlayerState(targetPlayerId) != PLAYER_STATE_DRIVER) {
                ShowBoxForPlayer(playerId, "This player isn't driving any vehicle.");
                return 1;
            }
        }

        if (!IsPlayerInAnyVehicle(targetPlayerId)) {
            ShowBoxForPlayer(playerId, "You need to be in a vehicle in order to repair it.");
            return 1;
        }

        targetVehicleId = GetPlayerVehicleID(targetPlayerId);
        if (Player(playerId)->isAdministrator() == false) {
            if (!CRace__IsRacing(targetPlayerId) && !IsPlayerInMapZone(targetPlayerId) && CruiseController->isCruiseActive() == false) {
                ShowBoxForPlayer(playerId, "You are only allowed to flip your vehicle during cruises, races or in map zones.");
                return 1;
            }

            if (!CRace__IsRacing(targetPlayerId) && !IsPlayerInMapZone(targetPlayerId) && CruiseController->isCruiseActive() == true) {
                if (CruiseController->isCruiseInsideLasVenturas() == true) {
                    ShowBoxForPlayer(playerId, "You can't flip your vehicle while the cruise is in Las Venturas.");
                    return 1;
                }

                if (CruiseController->isPlayerNearCruiseLeader(targetPlayerId) == false) {
                    ShowBoxForPlayer(playerId, "You can't use this command if you are too far away from the cruise leader.");
                    return 1;
                }
            }
        }

        // Everything must be ok, lets flip the vehicle and notify the player.
        new Float: vehiclePosition[3], Float: vehicleAngle;
        GetVehicleZAngle(targetVehicleId, vehicleAngle);
        GetVehiclePos(targetVehicleId, vehiclePosition[0], vehiclePosition[1], vehiclePosition[2]);

        SetVehiclePos(targetVehicleId, vehiclePosition[0], vehiclePosition[1], vehiclePosition[2] + 2);
        SetVehicleZAngle(targetVehicleId, vehicleAngle);

        SetVehicleHealth(targetVehicleId, 1000.0);
        RepairVehicle(targetVehicleId);

        ShowBoxForPlayer(playerId, "The vehicle has been flipped!");

        return 1;
    }
};
