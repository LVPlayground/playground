// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Support the commands and settings in the TeleportationCommands class with background functions.
 * Handle the changing of settings and the actual teleportation itself.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class TeleportationManager {
    // The delay before a player can teleport again is 3 minutes (180 seconds).
    const DefaultTeleportDelay = 180;

    // The delay before a player can carteleport again is 5 minutes (300 seconds).
    const CarTeleportDelay = 300;

    // The delay before a player can carteleport to the cruise again is 1 minute (60 seconds).
    const CarTeleportToCruiseDelay = 60;

    // For every player, we save the timestamp of teleportation.
    new m_playerTeleportTime[MAX_PLAYERS];

    // If a crew member wants to teleport to someone with teleportation disabled, we show a warning.
    new m_crewTeleportWarning[MAX_PLAYERS];

    /**
     * If everything's set, we teleport one player to another. Non-crew members have to pay a certain
     * price, but only if they don't own a special property. Player, subject and crew are informed
     * of this teleportation event.
     * 
     * @param playerId Id of the teleporting player.
     * @param subjectId Id of the player to teleport to.
     * @param teleportType Type of the teleport.
     */
    public teleportPlayer(playerId, subjectId, TeleportationType: teleportType) {
        // We deduct no money from crew members or owners of the property with the FreeTeleportFeature.
        // Else, the money is ours!
        new propertyId = PropertyManager->propertyForSpecialFeature(FreeTeleportFeature),
            ownerId = propertyId == Property::InvalidId ? Player::InvalidId : Property(propertyId)->ownerId();

        if (!Player(playerId)->isAdministrator() && playerId != ownerId && subjectId != CruiseController->getCruiseLeaderId()) {
            TakeRegulatedMoney(playerId, teleportType == DefaultTeleport ? TeleportWithoutVehicle
                                                                         : TeleportWithVehicle);
        }

        // By saving the current time in a member variable we're able to check later on if the user
        // isn't abusing the /(c)tp commands.
        m_playerTeleportTime[playerId] = Time->currentTime();

        // The correct world has to be set for the player in case the subject resides in a different world.
        SetPlayerVirtualWorld(playerId, GetPlayerVirtualWorld(subjectId));
        LegacyChangePlayerWorld(playerId, GetPlayerVirtualWorld(subjectId));

        // Also, if the carteleporter drives with multiple passengers, we've to teleport them along.
        if (teleportType == CarTeleport) {
            for (new passenger = 0; passenger <= PlayerManager->highestPlayerId(); passenger++) {
                if (Player(passenger)->isConnected() == false)
                    continue;

                if (GetPlayerVehicleID(playerId) == GetPlayerVehicleID(passenger))
                    LegacyChangePlayerWorld(passenger, GetPlayerVirtualWorld(subjectId));
            }
        }

        ReportPlayerTeleport(playerId);

        new const bool: isIsolated = PlayerSyncedData(playerId)->isolated();

        // For crew members only: the ability to teleport to players within interiors.
        if (teleportType == SecretTeleport)
            SetPlayerInterior(playerId, GetPlayerInterior(subjectId));

        // We allow both regular teleports and carteleports. For the latter, we have to teleport
        // the vehicle along.
        new Float: subjectPosition[3], vehicleId, trailerId;
        GetPlayerPos(subjectId, subjectPosition[0], subjectPosition[1], subjectPosition[2]);
        if (teleportType != DefaultTeleport && GetPlayerState(playerId) == PLAYER_STATE_DRIVER) {
            vehicleId = GetPlayerVehicleID(playerId);
            if (IsTrailerAttachedToVehicle(vehicleId))
                trailerId = GetVehicleTrailer(vehicleId);

            DetachTrailerFromVehicle(vehicleId);

            if (!isIsolated)
                SetVehicleVirtualWorld(vehicleId, GetPlayerVirtualWorld(subjectId));

            if (teleportType == SecretTeleport)
                LinkVehicleToInterior(vehicleId, GetPlayerInterior(subjectId));

            CBomb__ResetVehicleData(vehicleId);

            SetVehiclePos(vehicleId, subjectPosition[0] + 4, subjectPosition[1] + 4, subjectPosition[2] + 2);

            if (trailerId != 0) {
                if (!isIsolated)
                    SetVehicleVirtualWorld(trailerId, GetPlayerVirtualWorld(subjectId));
                if (teleportType == SecretTeleport)
                    LinkVehicleToInterior(trailerId, GetPlayerInterior(subjectId));
                AttachTrailerToVehicle(trailerId, vehicleId);
            }
        }

        else
            SetPlayerPos(playerId, subjectPosition[0] + 2, subjectPosition[1] + 2, subjectPosition[2] + 2);

        ClearPlayerMenus(playerId);

        // Inform the player, subject (except when secretly teleporting) and crew.
        new message[128];
        if (subjectId == CruiseController->getCruiseLeaderId())
            format(message, sizeof(message), "You have joined the cruise!");
        else {
            format(message, sizeof(message), "You have %s to %s (Id:%d), in world %d.",
                (teleportType == DefaultTeleport ? "teleported" :
                 teleportType == CarTeleport ? "carteleported" : "secretly teleported"),
                Player(subjectId)->nicknameString(), subjectId, GetPlayerVirtualWorld(subjectId));
        }
        ShowBoxForPlayer(playerId, message);

        if (teleportType != SecretTeleport && !isIsolated) {
            format(message, sizeof(message), "%s (Id:%d) has been %s to you using \"/%s\".",
                Player(playerId)->nicknameString(), playerId,
                (teleportType == DefaultTeleport ? "teleported" : "carteleported"),
                (teleportType == DefaultTeleport ? "tp" : "ctp"));
            ShowBoxForPlayer(subjectId, message);
        }

        format(message, sizeof(message), "%s (Id:%d) has been %s to %s (Id:%d), in world %d.",
            Player(playerId)->nicknameString(), playerId,
            (teleportType == DefaultTeleport ? "teleported" :
            teleportType == CarTeleport ? "carteleported" : "secretly teleported"),
            Player(subjectId)->nicknameString(), subjectId, GetPlayerVirtualWorld(subjectId));
        Admin(playerId, message);

        return 1;
    }

    /**
     * Checks whether or not a player is able to teleport to another player. Various checks are done
     * for players and crew members.
     * 
     * @param playerId Id of the teleporting player.
     * @param subjectId Id of the player to teleport to.
     * @param teleportType Type of the teleport.
     * @return boolean Is teleportation available for this player?
     */
    public bool: isTeleportAvailable(playerId, subjectId, TeleportationType: teleportType) {
        new delay = teleportType == DefaultTeleport ? DefaultTeleportDelay : CarTeleportDelay, message[128];

        // Carteleporting to the cruise is allowed once per minute, except for secret teleports.
        if (subjectId == CruiseController->getCruiseLeaderId() &&
                Time->currentTime() - m_playerTeleportTime[playerId] < CarTeleportToCruiseDelay &&
                teleportType != SecretTeleport) {
            format(message, sizeof(message), "You may only %s to the cruise once per minute.",
                (teleportType == DefaultTeleport ? "teleport" : "carteleport"),
                CarTeleportToCruiseDelay / 60);

            SendClientMessage(playerId, Color::Error, message);
            return false;
        }

        // Both teleport and carteleport is limited in use to avoid abuse, except for crew members.
        if (subjectId != CruiseController->getCruiseLeaderId() &&
                Time->currentTime() - m_playerTeleportTime[playerId] < delay &&
                teleportType != SecretTeleport) {
            format(message, sizeof(message), "You may only %s once every %d minutes.",
            (teleportType == DefaultTeleport ? "teleport" : "carteleport"),
            (teleportType == DefaultTeleport ? DefaultTeleportDelay / 60 : CarTeleportDelay / 60));

            SendClientMessage(playerId, Color::Error, message);
            return false;
        }

        // General exceptions are checked.
        if (playerId == subjectId) {
            SendClientMessage(playerId, Color::Error, "You can't teleport to yourself.");
            return false;
        }

        if (Player(subjectId)->isNonPlayerCharacter()) {
            SendClientMessage(playerId, Color::Error, "You can't teleport to NPCs.");
            return false;
        }

        // Don't teleport to players who are currently spectating somebody.
        if (PlayerSpectateHandler->isSpectating(subjectId)) {
            SendClientMessage(playerId, Color::Error, "This player has disallowed others from teleporting to them using /my teleport off");
            return false;
        }

        // However, for /stp different rules apply. /stp is available for crew members to check out
        // a player anywhere at any moment. That's why we allow them to teleport even when the player
        // is in a minigame or something.
        if (teleportType != SecretTeleport) {
            if (!CanPlayerTeleport(playerId)) {
                SendClientMessage(playerId, Color::Error, "Because of recent fighting activities, you aren't able to teleport.");
                return false;
            }

            if (Player(subjectId)->isRegistered() == true && Player(subjectId)->isLoggedIn() == false) {
                SendClientMessage(playerId, Color::Error, "This player hasn't logged in yet.");
                return false;
            }

#if Feature::DisableFights == 0
            if (CFightClub__IsPlayerFighting(subjectId)) {
                SendClientMessage(playerId, Color::Error, "This player is currently in the Fightclub, use \"/fight watch\".");
                return false;
            }

            if (LegacyIsPlayerWatchingFC(subjectId)) {
                SendClientMessage(playerId, Color::Error, "This player is watching someone in the Fightclub.");
                return false;
            }
#endif

            if (JailController->isPlayerJailed(subjectId) == true) {
                SendClientMessage(playerId, Color::Error, "This player is currently in jail.");
                return false;
            }

            if (LegacyIsPlayerInBombShop(subjectId) == true) {
                SendClientMessage(playerId, Color::Error, "This player is currently in the Bombshop.");
                return false;
            }

            if (IsPlayerInMapZone(subjectId)) {
                SendClientMessage(playerId, Color::Error, "This player is currently in a map zone.");
                return false;
            }

            if (LegacyIsPlayerChased(subjectId) == true) {
                SendClientMessage(playerId, Color::Error, "This player is currently being chased and thus can't be teleported to.");
                return false;
            }

            if (IsPlayerInMinigame(subjectId)) {
                SendClientMessage(playerId, Color::Error, "This player is currently taking part in a minigame.");
                return false;
            }

            if (IsPlayerInMinigame(playerId)) {
                SendClientMessage(playerId, Color::Error, "You can't use this in a minigame, use \"/leave\" first.");
                return false;
            }

            if (GetPlayerInterior(subjectId) != 0 || LegacyIsPlayerInVipRoom(subjectId) == true) {
                SendClientMessage(playerId, Color::Error, "This player is currently inside an interior.");
                return false;
            }

            if (GetPlayerInterior(playerId) != 0 || LegacyIsPlayerInVipRoom(playerId) == true) {
                SendClientMessage(playerId, Color::Error, "You are currently inside an interior. Use this command again outside.");
                return false;
            }
        }

        // If a subject has teleportation disabled, only crew members are able to teleport. But before
        // that happens, we show them a warning to reconsider this. They have to re-enter the command
        // to actually teleport, to avoid cases of crew members abusing their rights.
        if (PlayerSettings(subjectId)->isTeleportationDisabled() == true && teleportType != SecretTeleport &&
            subjectId != CruiseController->getCruiseLeaderId()) {
            if (Player(playerId)->isAdministrator() == false) {
                SendClientMessage(playerId, Color::Error, "This player has disallowed others from teleporting to them using /my teleport off");
                return false;
            }

            if (Player(playerId)->isAdministrator() == true && m_crewTeleportWarning[playerId] == 0) {
                m_crewTeleportWarning[playerId] = 2;
                SendClientMessage(playerId, Color::Error,
                    "This player has disabled teleporting. Enter this command again to force teleportation.");
                return false;
            }

            // The warning has been showed before and the command has been re-entered. Let's go!
            if (Player(playerId)->isAdministrator() == true && m_crewTeleportWarning[playerId] != 0)
                return true;
        }

        // Owners of the property with the FreeTeleportFeature are allowed to (car)teleport for free.
        // Else, we check if the player carries enough cash to make the teleportation happen. This
        // doesn't apply to crew members.
        new propertyId = PropertyManager->propertyForSpecialFeature(FreeTeleportFeature),
            ownerId = propertyId == Property::InvalidId ? Player::InvalidId : Property(propertyId)->ownerId(),
            teleportPrice[12];

        new const price = GetEconomyValue(teleportType == DefaultTeleport ? TeleportWithoutVehicle
                                                                          : TeleportWithVehicle);

        if (teleportType != SecretTeleport && GetPlayerMoney(playerId) < price && playerId != ownerId
            && subjectId != CruiseController->getCruiseLeaderId()) {
            FinancialUtilities->formatPrice(price, teleportPrice, sizeof(teleportPrice));
            format(message, sizeof(message),
                "You'll need %s to teleport. Buy the Area 69 Control Tower property for free teleports!",
                teleportPrice);
            SendClientMessage(playerId, Color::Error, message);

            return false;
        }

        return true;
    }

    /**
     * Reset various variables on player connect.
     *
     * @param playerId Id of the player who just connected to LVP.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_playerTeleportTime[playerId] = 0;
        m_crewTeleportWarning[playerId] = 0;

        return 1;
    }

    /**
     * Per minute tick we process member variables concerning crew teleport warnings.
     */
    @list(MinuteTimer)
    public onMinuteTimerTick() {
        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
            if (Player(playerId)->isConnected() == false || Player(playerId)->isAdministrator() == false)
                continue;

            if (m_crewTeleportWarning[playerId] >= 1)
                m_crewTeleportWarning[playerId] --;
        }

        return 1;
    }

    /**
     * In order to properly implement the map teleportation feature, we need to listen to player
     * map click events and handle them accordingly. Check whether the player is allowed to use map
     * teleportation, and if so, teleport them there (with car if necessary).
     *
     * @param playerId Id of the player who should be teleported on the map.
     * @param positionX X-coordinate of where they're requesting to be teleported.
     * @param positionY Y-coordinate of where they're requesting to be teleported.
     * @param positionZ Z-coordinate of where they're requesting to be teleported. Often inaccurate.
     */
    @list(OnPlayerClickMap)
    public onPlayerClickMap(playerId, Float: positionX, Float: positionY, Float: positionZ) {
        if (PlayerSettings(playerId)->isMapTeleportationEnabled() == false)
            return 0; // map teleportation is not available for this player.

        if (IsPlayerInAnyVehicle(playerId))
            SetVehiclePos(GetPlayerVehicleID(playerId), positionX, positionY, positionZ);
        else SetPlayerPos(playerId, positionX, positionY, positionZ);

        return 1;
    }
};
