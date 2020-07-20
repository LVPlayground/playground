// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * A simple task: fix the player when needed. In our case fixing generally means: resetting every
 * known variable that could possibly interupt the player from having fun. Our goal is to make this
 * as user-friendly as possible, meaning we'll be saving and resetting a lot of variables concerning
 * the player's environment.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class FixPlayerCommands {
    // Since we force the player to respawn, we'll be kind enough to save their holding cash and
    // restore it upon spawning.
    new m_playerCash[MAX_PLAYERS];

    // We store the weapon Id of each weapon for the fixing player.
    new m_playerWeaponId[WeaponSlots][MAX_PLAYERS];

    // We store the ammo amount of each weapon for the fixing player.
    new m_playerWeaponAmmo[WeaponSlots][MAX_PLAYERS];

    // Track if the player's variables needs to be set on spawn.
    new bool: m_resetPlayerVariables[MAX_PLAYERS];

    /**
     * Crew can fix a player by using the /fix command.
     *
     * @param playerId Id of the player who issued this command.
     * @param player Id or name of the player to fix.
     * @command /fix [player]
     */
    @command("fix")
    public onFixCommand(playerId, params[]) {
        if (Player(playerId)->isAdministrator() == false)
            return 0;

        if (Command->parameterCount(params) != 1) {
            SendClientMessage(playerId, Color::Information, "Usage: /fix [player]");
            return 1;
        }

        new subjectId = Command->playerParameter(params, 0, playerId);
        if (subjectId == Player::InvalidId)
            return 1;

        if (Player(subjectId)->isNonPlayerCharacter() == true) {
            SendClientMessage(playerId, Color::Error, "Use /fixservices to fix all bots at once.");
            return 1;
        }

        if (JailController->isPlayerJailed(subjectId) == true) {
            SendClientMessage(playerId, Color::Error, "This player is currently jailed and can't be fixed.");
            return 1;
        }

        this->fixPlayer(subjectId);

        new notice[128];
        if (playerId != subjectId)
            SendClientMessage(subjectId, Color::Success, "A crewmember has magically fixed you!");

        format(notice, sizeof(notice), "%s (Id:%d) fixed.", Player(subjectId)->nicknameString(), subjectId);
        SendClientMessage(playerId, Color::Success, notice);

        format(notice, sizeof(notice), "%s (Id:%d) has fixed %s (Id:%d).", Player(playerId)->nicknameString(),
            playerId, Player(subjectId)->nicknameString(), subjectId);
        Admin(playerId, notice);

        return 1;
    }

    /**
     * Crew can secretly fix a player by using the /sfix command.
     *
     * @param playerId Id of the player who issued this command.
     * @param player Id or name of the player to secretly fix.
     * @command /sfix [player]
     */
    @command("sfix")
    public onSecretFixCommand(playerId, params[]) {
        if (Player(playerId)->isAdministrator() == false)
            return 0;

        if (Command->parameterCount(params) != 1) {
            SendClientMessage(playerId, Color::Information, "Usage: /sfix [player]");
            return 1;
        }

        new subjectId = Command->playerParameter(params, 0, playerId);
        if (subjectId == Player::InvalidId)
            return 1;

        if (Player(subjectId)->isNonPlayerCharacter() == true) {
            SendClientMessage(playerId, Color::Error, "Use /fixservices to fix all bots at once.");
            return 1;
        }

        if (JailController->isPlayerJailed(subjectId) == true) {
            SendClientMessage(playerId, Color::Error, "This player is currently jailed and can't be fixed.");
            return 1;
        }

        this->fixPlayer(subjectId);

        new notice[128];
        format(notice, sizeof(notice), "%s (Id:%d) secretly fixed.", Player(subjectId)->nicknameString(), subjectId);
        SendClientMessage(playerId, Color::Success, notice);

        format(notice, sizeof(notice), "%s (Id:%d) has secretly fixed %s (Id:%d).", Player(playerId)->nicknameString(),
            playerId, Player(subjectId)->nicknameString(), subjectId);
        Admin(playerId, notice);

        return 1;
    }

    /**
     * Reset all variables necessary to 'fix' a player.
     *
     * @param playerId Id of the player to fix.
     */
    private fixPlayer(playerId) {
        // Save various variables used to reset the player's state as accurate as possible.
        m_playerCash[playerId] = GetPlayerMoney(playerId);

        // Start resetting various variables.
        ResetWorldBounds(playerId);
        ResetPlayerWeapons(playerId);
        SetPlayerSpecialAction(playerId, SPECIAL_ACTION_NONE);
        ClearAnimations(playerId);
        ClearPlayerMenus(playerId);
        HidePlayerBox(playerId);
        SetPlayerMapZone(playerId, -1);
        RemovePlayerFromVehicle(playerId);
        TogglePlayerSpectating(playerId, false);
        ColorManager->setPlayerMarkerHidden(playerId, false);

        for (new subjectId = 0; subjectId <= PlayerManager->highestPlayerId(); ++subjectId) {
            if (Player(subjectId)->isConnected() == false)
                continue;

            ShowPlayerNameTagForPlayer(subjectId, playerId, true);
            ShowPlayerNameTagForPlayer(playerId, subjectId, true);
        }
        ColorManager->releasePlayerMinigameColor(playerId);

        SetPlayerWantedLevel(playerId, 0);
        RemovePlayerFromAnyGame(playerId);
        SetInvolvedInJavaScriptGame(playerId, false);

        // @TODO: Get rid of the legacy stuff.
        LegacyFixPlayer(playerId);

        // Save all carrying weapons. We only save the weapon in slot 7 if we are fixing a crew
        // member, since this slot handles miniguns, rockets etc.
        new weaponId, ammo;
        for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot) {
            if (weaponSlot == 7 && Player(playerId)->isAdministrator() == false)
                continue;

            if (SpawnWeaponManager(playerId)->spawnWeaponId(weaponSlot) != 0) {
                m_playerWeaponId[weaponSlot][playerId] = SpawnWeaponManager(playerId)->spawnWeaponId(weaponSlot);
                m_playerWeaponAmmo[weaponSlot][playerId] = SpawnWeaponManager(playerId)->spawnWeaponAmmo(weaponSlot);
            }

            GetPlayerWeaponData(playerId, weaponSlot, weaponId, ammo);
            if (weaponId == 0 || ammo == 0)
                continue;

            m_playerWeaponId[weaponSlot][playerId] = weaponId;
            m_playerWeaponAmmo[weaponSlot][playerId] = ammo;
        }

        // Finally, respawn the player.
        SpawnPlayer(playerId);
        TogglePlayerControllable(playerId, 1);

        m_resetPlayerVariables[playerId] = true;

        return 1;
    }

    /**
     * If we forced the player to respawn for a fix, we'll reset several variables.
     *
     * @param playerId Id of the spawning player.
     */
    @list(OnPlayerSpawn)
    public onPlayerSpawn(playerId) {
        if (m_resetPlayerVariables[playerId] == false)
            return 0;

        // Reset the player's money, since this is lost on respawn.
        ResetPlayerMoney(playerId);
        GivePlayerMoney(playerId, m_playerCash[playerId]);  // reset their money

        // Set the player's own skin if needed.
        new skinId = SpawnManager(playerId)->skinId();
        if (skinId != SpawnManager::InvalidSkinId)
            SetPlayerSkinEx(playerId, skinId);

        // Finally, reset the player's carrying weapons.
        ResetPlayerWeapons(playerId);
        for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot) {
            if (m_playerWeaponId[weaponSlot][playerId] == 0 || m_playerWeaponAmmo[weaponSlot][playerId] == 0)
                continue;

            GiveWeapon(playerId, m_playerWeaponId[weaponSlot][playerId], m_playerWeaponAmmo[weaponSlot][playerId]);
        }

        TogglePlayerControllable(playerId, 1);
        m_resetPlayerVariables[playerId] = false;

        return 1;
    }

    /**
     * Make sure we empty several variables concerning fixing players.
     *
     * @param playerId Id of the player who connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_resetPlayerVariables[playerId] = false;

        for (new weaponSlot = 0; weaponSlot < WeaponSlots; ++weaponSlot) {
            m_playerWeaponId[weaponSlot][playerId] = 0;
            m_playerWeaponId[weaponSlot][playerId] = 0;
        }

        return 1;
    }
};