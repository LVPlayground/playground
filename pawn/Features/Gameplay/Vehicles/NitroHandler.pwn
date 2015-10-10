// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * It is ofcourse fun to hop in a car and drive around in the server. The sad thing that not all
 * cars are that fast. To fix that we have the ability to give cars nitro. In this class we handle
 * the ability to attach nitro to a car via scripts and by command.
 *
 * @author Xander "Xanland" Hoogland <home@xanland.nl>
 */
class NitroHandler {
    // Keeps track whether the specific vehicle has infite nos attached.
    new bool: m_vehicleHasInfiniteNosAttached[MAX_VEHICLES];

    /**
     * To attach nitro to a vehicle, players can use /nos to attach. When no params are used then it will
     * show how to use the command. Else it attaches the amount of nitro the player asked for.
     * 
     * @param playerId Id of the player who typed the command.
     * @param amount Amount of nitro to be attached, possible values are: 2, 5, 10 and inf(inite).
     * @command /nos [amount]
     */
    @command("nos")
    public onNosCommand(playerId, params[]) {
        if (GetPlayerState(playerId) != PLAYER_STATE_DRIVER) {
            SendClientMessage(playerId, Color::Error, "Since you aren't the driver of a vehicle, you can't attach nos.");
            return 1;
        }

        new playerVehicleId = GetPlayerVehicleID(playerId),
            modelId = GetVehicleModel(playerVehicleId);

        // Let's take a look if the vehicle is nitro-applicable.
        if (VehicleModel(modelId)->isNitroInjectionAvailable() == false) {
            SendClientMessage(playerId, Color::Error, "The vehicle you are currently driving can't have nos attached.");
            return 1;
        }

        new parameterValue[10],
            amountOfNitro = Command->integerParameter(params, 0);

        // Quick and dirty fix/hack to make sure strcmp does it work good (strcmp is always 0 when
        // one of the input-strings is empty
        if (Command->stringParameter(params, 0, parameterValue, sizeof(parameterValue)) <= 0) {
            parameterValue = "null";
        }

        // Set to a high amount so we can easier check if the player wants to buy infinite nitro
        if (!strcmp(parameterValue, "inf", false) || !strcmp(parameterValue, "infinite", false)) {
            amountOfNitro = 999;
        }

        // Does the first part of the params contains a valid amount of nitro: 2, 5, 10 or 999 for
        // infinite? If not, we send the player an usage-message. Else, we attach the nitro and let
        // them pay and play.
        switch (amountOfNitro) {
            case 2: {
                if (GetPlayerMoney(playerId) >= 2000) {
                    GivePlayerMoney(playerId, -2000);
                    AddVehicleComponent(playerVehicleId, 1008);
                } else {
                    SendClientMessage(playerId, Color::Error, "You do need $2,000 to attach 2x nos to your vehicle.");
                    return 1;
                }
            }

            case 5: {
                if (GetPlayerMoney(playerId) >= 5000) {
                    GivePlayerMoney(playerId, -5000);
                    AddVehicleComponent(playerVehicleId, 1009);
                } else {
                    SendClientMessage(playerId, Color::Error, "You do need $5,000 to attach 5x nos to your vehicle.");
                    return 1;
                }
            }

            case 10: {
                if (GetPlayerMoney(playerId) >= 10000) {
                    GivePlayerMoney(playerId, -10000);
                    AddVehicleComponent(playerVehicleId, 1010);
                } else {
                    SendClientMessage(playerId, Color::Error, "You do need $10,000 to attach 10x nos to your vehicle.");
                    return 1;
                }
            }

            case 999: {
                if (GetPlayerMoney(playerId) >= 250000) {
                    GivePlayerMoney(playerId, -250000);
                    m_vehicleHasInfiniteNosAttached[playerVehicleId] = true;
                    AddVehicleComponent(playerVehicleId, 1008);
                } else {
                    SendClientMessage(playerId, Color::Error, "You do need $250,000 to attach infinite nos to your vehicle.");
                    return 1;
                }
            }

            default:
            {
                return SendClientMessage(playerId, Color::Information, "Usage: /nos [2/5/10/inf(inite)]");
            }
        }

        // Play a sound to attend the player that we've attached nitro to their vehicle
        PlayerPlaySound(playerId, 1133, 0.0, 0.0, 0.0);
        return SendClientMessage(playerId, Color::Success, "Nos has been successfully attached to your vehicle.");
    }

    /**
     * A state change of the player's key requires us to detect if he has bought infinite nos and
     * in that case to apply it.
     *
     * @param playerId Id of the player changing their keys.
     * @param newKeys The new key(s).
     * @param oldKeys The old key(s).
     **/
    @list(OnPlayerKeyStateChange)
    public OnPlayerKeyStateChange(playerId, newkeys, oldkeys) {
        // Check for a very specific state
        if ((PRESSED(KEY_FIRE) || (PRESSED(KEY_FIRE) && PRESSED(KEY_SECONDARY_ATTACK))) && 
            GetPlayerState(playerId) == PLAYER_STATE_DRIVER) {
            new vehicleId = GetPlayerVehicleID(playerId);
            if (m_vehicleHasInfiniteNosAttached[vehicleId]) {
                RemoveVehicleComponent(vehicleId, 1008);
                AddVehicleComponent(vehicleId, 1008);
            }
        }

        return 1;
    }

    /**
     * In the case the vehicle is destroyed we have to let our handler now this vehicle has no
     * infinite nos anymore.
     *
     * @param vehicleId Id of the vehicle containing infinite nos.
     **/
    @list(OnVehicleDeath)
    public OnVehicleDeath(vehicleId) {
        // Check for a very specific state
        if (m_vehicleHasInfiniteNosAttached[vehicleId]) {
            RemoveVehicleComponent(vehicleId, 1008);
            m_vehicleHasInfiniteNosAttached[vehicleId] = false;
        }

        return 1;
    }
};
