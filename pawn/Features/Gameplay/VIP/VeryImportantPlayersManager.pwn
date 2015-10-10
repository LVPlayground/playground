// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Our important players support LVP by donating. In return, we offer them various extras regular
 * players won't/partially have. This class manages such bonusses.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl
 */
class VeryImportantPlayersManager {
    /**
     * This function will either change the VIP player's weather, or respond with an error,
     * depending on the input.
     * 
     * @param playerId Id of the player who executed the command.
     * @param subjectId Id of the player who we want to change the weather for.
     * @param weatherType The weather that we're gonna apply to the player.
     */
    public changeVipWeather(playerId, weatherType[]) {
        if (strcmp(weatherType, "day", true) == 0) {
            SetPlayerWeather(playerId, 0);
            TimeController->setPlayerOverrideTime(playerId, 12, 0);
        } else if (strcmp(weatherType, "evening", true) == 0) {
            SetPlayerWeather(playerId, 33);
            TimeController->setPlayerOverrideTime(playerId, 0, 0);
        } else if (strcmp(weatherType, "hot", true) == 0) {
            SetPlayerWeather(playerId, 11);
            TimeController->setPlayerOverrideTime(playerId, 12, 0);
        } else if (strcmp(weatherType, "storm", true) == 0) {
            SetPlayerWeather(playerId, 08);
            TimeController->setPlayerOverrideTime(playerId, 12, 0);
        } else if (strcmp(weatherType, "foggy", true) == 0) {
            SetPlayerWeather(playerId, 09);
            TimeController->setPlayerOverrideTime(playerId, 12, 0);
        } else if (strcmp(weatherType, "drugs", true) == 0) {
            SetPlayerWeather(playerId, -66);
            TimeController->setPlayerOverrideTime(playerId, 12, 0);
        } else
            SendClientMessage(playerId, Color::Information, "Usage: /my weather [day/evening/hot/storm/foggy/drugs]");

        return 1;
    }

    /**
     * Before we change a VIP his/her look, we make sure the player won't get glitched by changing
     * his/her skin. Therefore, we remove the player from any vehicle and remove the animations.
     * After that the specific objects and weapons are attached to the player.
     * 
     * @param playerId Id of the player who executed the command.
     * @param subjectId Id of the player who we want to change the look for.
     * @param lookType The look that we're gonna apply to the player.
     */
    public changeVipLook(playerId, lookType[]) {
        if (GetPlayerVehicleSeat(playerId) != -1)
            RemovePlayerFromVehicle(playerId);

        TogglePlayerControllable(playerId, 0);

        if (strcmp(lookType, "maniac", true) == 0) {
            SetPlayerSpecialAction(playerId, 0);
            SetPlayerSkinEx(playerId, 49);

            SetPlayerAttachedObject(playerId, 0, 19113, 2, 0.13, 0, 0, -7.4, -0.88, -8.39, 1, 1.25, 1.04);
            SetPlayerAttachedObject(playerId, 1, 19037, 2, 0.079, 0.029, 0, -10.8, 90.37, 94.9, 1.02, 1.05, 1);
            GiveWeapon(playerId, 9, 1);
        }

        else if (strcmp(lookType, "punk", true) == 0) {
            SetPlayerSpecialAction(playerId, 0);
            SetPlayerSkinEx(playerId, 75);

            SetPlayerAttachedObject(playerId, 0, 18977, 2, 0.07, 0.005, 0, -90.9, 101.05, -177, 1.20, 1.05, 1);
            GiveWeapon(playerId, 10, 1);

            if (IsPlayerAttachedObjectSlotUsed(playerId, 1) == 1)
                RemovePlayerAttachedObject(playerId, 1);
        }

        else if (strcmp(lookType, "riot", true) == 0) {
            SetPlayerSpecialAction(playerId, 0);
            SetPlayerSkinEx(playerId, 292);

            SetPlayerAttachedObject(playerId, 0, 19064, 2, 0.10, 0.01, 0, -90.19, 86.36, -179.88, 1.06, 1.15, 1.09);
            GiveWeapon(playerId, 1, 1);

            if (IsPlayerAttachedObjectSlotUsed(playerId, 1) == 1)
                RemovePlayerAttachedObject(playerId, 1);
        }

        else if (strcmp(lookType, "assassin", true) == 0) {
            SetPlayerSpecialAction(playerId, 0);
            SetPlayerSkinEx(playerId, 120);

            SetPlayerAttachedObject(playerId, 0, 18947, 2, 0.11, 0, 0, -178.77, -176.52, -179.7, 1.09, 1.09, 1.05);
            SetPlayerAttachedObject(playerId, 1, 19033, 2, 0.077, 0.029, 0, 93.87, 83.3, -0.99, 1.02, 1.08, 1);
            GiveWeapon(playerId, 23, 1337);
        }

        else if (strcmp(lookType, "ninja", true) == 0) {
            SetPlayerSpecialAction(playerId, 0);
            SetPlayerSkinEx(playerId, 294);

            SetPlayerAttachedObject(playerId, 0, 18974, 2, 0.074, 0.024, 0, 93.87, 83.3, -0.99, 1.096, 1.112, 1);
            GiveWeapon(playerId, 8, 1);

            if (IsPlayerAttachedObjectSlotUsed(playerId, 1) == 1)
                RemovePlayerAttachedObject(playerId, 1);
        }

        else if (strcmp(lookType, "bastard", true) == 0) {
            SetPlayerSpecialAction(playerId, 0);
            SetPlayerSkinEx(playerId, 213);

            SetPlayerAttachedObject(playerId, 0, 18972, 2, 0.12, 0.02, 0, -84.76, 99.97, 178.3, 1.11, 1.06, 1.02);
            GiveWeapon(playerId, 15, 1);

            if (IsPlayerAttachedObjectSlotUsed(playerId, 1) == 1)
                RemovePlayerAttachedObject(playerId, 1);
        }

        else
            SendClientMessage(playerId, Color::Information, "Usage: /my look [assassin/bastard/maniac/ninja/punk/riot]");

        TogglePlayerControllable(playerId, 1);

        return 1;
    }

    /**
     * Upon spawning, VIPs receive full armor immediately.
     *
     * @param playerId Id of the VIP who spawned.
     */
    @list(OnPlayerSpawn)
    public onVipSpawn(playerId) {
        if (Player(playerId)->isVip() == false)
            return 0;

        SetPlayerArmour(playerId, 100);

        return 1;
    }
};
