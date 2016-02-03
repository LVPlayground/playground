// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// The look applying to a VIP member. Must be reset whilst they're aiming.
enum VeryImportantPlayerLook {
    DEFAULT_LOOK,
    MANIAC_LOOK,
    PUNK_LOOK,
    RIOT_LOOK,
    ASSASSIN_LOOK,
    NINJA_LOOK,
    BASTARD_LOOK
};

/**
 * Our important players support LVP by donating. In return, we offer them various extras regular
 * players won't/partially have. This class manages such bonusses.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class VeryImportantPlayersManager {
    /**
     * The looks assigned to each of the players. Will default to DEFAULT_LOOK but can be set to
     * another value using the "/my look" command.
     */
    new VeryImportantPlayerLook: m_playerLooks[MAX_PLAYERS];

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
            SetPlayerWeather(playerId, 8);
            TimeController->setPlayerOverrideTime(playerId, 12, 0);
        } else if (strcmp(weatherType, "foggy", true) == 0) {
            SetPlayerWeather(playerId, 9);
            TimeController->setPlayerOverrideTime(playerId, 12, 0);
        } else if (strcmp(weatherType, "drugs", true) == 0) {
            SetPlayerWeather(playerId, -66);
            TimeController->setPlayerOverrideTime(playerId, 12, 0);
        } else {
            SendClientMessage(playerId, Color::Information, "Usage: /my weather [day/evening/hot/storm/foggy/drugs]");
            return 0;
        }

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
    public changeVipLook(playerId, lookType[], VeryImportantPlayerLook: lookEnumType = DEFAULT_LOOK) {
        if (GetPlayerVehicleSeat(playerId) != -1)
            RemovePlayerFromVehicle(playerId);

        TogglePlayerControllable(playerId, 0);

        if (strcmp(lookType, "reset", true) == 0) {
            new skinId = SpawnManager(playerId)->skinId();
            if (skinId != SpawnManager::InvalidSkinId) {
                SetPlayerSpecialAction(playerId, 0);
                SetPlayerSkinEx(playerId, skinId);
            }

            this->suspendPlayerLook(playerId);
            m_playerLooks[playerId] = DEFAULT_LOOK;
        }

        else if (strcmp(lookType, "maniac", true) == 0 || lookEnumType == MANIAC_LOOK) {
            SetPlayerSpecialAction(playerId, 0);
            SetPlayerSkinEx(playerId, 49);

            m_playerLooks[playerId] = MANIAC_LOOK;
            this->applyPlayerLook(playerId);

            GiveWeapon(playerId, 9, 1);
        }

        else if (strcmp(lookType, "punk", true) == 0 || lookEnumType == PUNK_LOOK) {
            SetPlayerSpecialAction(playerId, 0);
            SetPlayerSkinEx(playerId, 75);

            m_playerLooks[playerId] = PUNK_LOOK;
            this->applyPlayerLook(playerId);

            GiveWeapon(playerId, 10, 1);

            if (IsPlayerAttachedObjectSlotUsed(playerId, 1))
                RemovePlayerAttachedObject(playerId, 1);
        }

        else if (strcmp(lookType, "riot", true) == 0 || lookEnumType == RIOT_LOOK) {
            SetPlayerSpecialAction(playerId, 0);
            SetPlayerSkinEx(playerId, 292);

            m_playerLooks[playerId] = RIOT_LOOK;
            this->applyPlayerLook(playerId);

            GiveWeapon(playerId, 1, 1);

            if (IsPlayerAttachedObjectSlotUsed(playerId, 1))
                RemovePlayerAttachedObject(playerId, 1);
        }

        else if (strcmp(lookType, "assassin", true) == 0 || lookEnumType == ASSASSIN_LOOK) {
            SetPlayerSpecialAction(playerId, 0);
            SetPlayerSkinEx(playerId, 120);

            m_playerLooks[playerId] = ASSASSIN_LOOK;
            this->applyPlayerLook(playerId);

            GiveWeapon(playerId, 23, 1337);
        }

        else if (strcmp(lookType, "ninja", true) == 0 || lookEnumType == NINJA_LOOK) {
            SetPlayerSpecialAction(playerId, 0);
            SetPlayerSkinEx(playerId, 294);

            m_playerLooks[playerId] = NINJA_LOOK;
            this->applyPlayerLook(playerId);

            GiveWeapon(playerId, 8, 1);

            if (IsPlayerAttachedObjectSlotUsed(playerId, 1))
                RemovePlayerAttachedObject(playerId, 1);
        }

        else if (strcmp(lookType, "bastard", true) == 0 || lookEnumType == BASTARD_LOOK) {
            SetPlayerSpecialAction(playerId, 0);
            SetPlayerSkinEx(playerId, 213);

            m_playerLooks[playerId] = BASTARD_LOOK;
            this->applyPlayerLook(playerId);

            GiveWeapon(playerId, 15, 1);

            if (IsPlayerAttachedObjectSlotUsed(playerId, 1))
                RemovePlayerAttachedObject(playerId, 1);
        }

        else
            SendClientMessage(playerId, Color::Information, "Usage: /my look {DC143C}[reset] {FFFFFF}[assassin/bastard/maniac/ninja/punk/riot]");

        TogglePlayerControllable(playerId, 1);
        return 1;
    }

    /**
     * Applies the looks for |playerId|. Must be previously set, and will be reset on respawn.
     *
     * @param playerId Id of the player to set the look for.
     */
    public applyPlayerLook(playerId) {
        switch (m_playerLooks[playerId]) {
            case MANIAC_LOOK: {
                SetPlayerAttachedObject(playerId, 0, 19113, 2, 0.13, 0, 0, -7.4, -0.88, -8.39, 1, 1.25, 1.04);
                SetPlayerAttachedObject(playerId, 1, 19037, 2, 0.079, 0.029, 0, -10.8, 90.37, 94.9, 1.02, 1.05, 1);
            }
            case PUNK_LOOK:
                SetPlayerAttachedObject(playerId, 0, 18977, 2, 0.07, 0.005, 0, -90.9, 101.05, -177, 1.20, 1.05, 1);
            case RIOT_LOOK:
                SetPlayerAttachedObject(playerId, 0, 19064, 2, 0.10, 0.01, 0, -90.19, 86.36, -179.88, 1.06, 1.15, 1.09);
            case ASSASSIN_LOOK: {
                SetPlayerAttachedObject(playerId, 0, 18947, 2, 0.11, 0, 0, -178.77, -176.52, -179.7, 1.09, 1.09, 1.05);
                SetPlayerAttachedObject(playerId, 1, 19033, 2, 0.077, 0.029, 0, 93.87, 83.3, -0.99, 1.02, 1.08, 1);
            }
            case NINJA_LOOK:
                SetPlayerAttachedObject(playerId, 0, 18974, 2, 0.074, 0.024, 0, 93.87, 83.3, -0.99, 1.096, 1.112, 1);
            case BASTARD_LOOK:
                SetPlayerAttachedObject(playerId, 0, 18972, 2, 0.12, 0.02, 0, -84.76, 99.97, 178.3, 1.11, 1.06, 1.02);
        }
    }

    /**
     * Removes any custom attached objects from a player. May be used when they're aiming, to make
     * sure that the custom objects don't interfere with their shooting performance.
     *
     * @param playerId Id of the player to remove the objects for.
     */
    public suspendPlayerLook(playerId) {
        if (m_playerLooks[playerId] == DEFAULT_LOOK)
            return;

        for (new slot = 0; slot < 2; ++slot) {
            if (IsPlayerAttachedObjectSlotUsed(playerId, slot))
                RemovePlayerAttachedObject(playerId, slot);
        }
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

        if (m_playerLooks[playerId] != DEFAULT_LOOK)
            this->changeVipLook(playerId, "_", m_playerLooks[playerId]);

        SetPlayerArmour(playerId, 100);
        return 1;
    }
};