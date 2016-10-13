// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
*   Las Venturas Playground v2.90 - Grand Theft Auto. Grand Theft Auto is      *
*   a minigame that runs every few hours. Basically the server picks a random  *
*   parked vehicle that is not in use, and requests it to be delivered to the  *
*   merchant for a fixed some of money, generally, a lot more money than       *
*   the exports. The car gets marked with a yellow icon for everyone so there  *
*   is some competiton for it!                                                 *
*                                                                              *
*           Authors: Russell         russell@sa-mp.nl                          *
*                    Jay             wilkinson_929@hotmail.com                 *
*                                                                              *
*******************************************************************************/

#define INVALID_GTA_MAP_ICON (DynamicMapIcon: -1)

// Defines:
#define MERCHANT_EXPIRE_MINUTES         45  // Number of minutes after which the merchant loses interest.
#define MERCHANT_REMOVAL_DELAY_SECONDS  20  // Number of seconds, after delivery, to remove the merchant.

new GTA_Value = 0;
new GTA_Vehicle = -1;
new GTA_Merchant = Player::InvalidId;

new DynamicMapIcon: GTA_MapIcon = INVALID_GTA_MAP_ICON;

new bool: GTA_SetVehicleObjective[MAX_PLAYERS];

new GTA_RemoveMerchantTime = -1;
new GTA_StopMinigameTime = -1;

// -------------------------------------------------------------------------------------------------

// Initialises the GTA Merchant minigame. Called once per ninety minutes.
CTheft__Initalize() {
    if (GTA_Vehicle != -1)
        CTheft__End(false /* sendMessage */, "");

    GTA_Vehicle = CTheft__ChooseRandomVehicle();
	GTA_Value = GetEconomyValue(GrandTheftAutoRandomVehicleValue);

    new vehicleModel = GetVehicleModel(GTA_Vehicle);
    if (!VehicleModel->isValidVehicleModel(vehicleModel))
        return;

    GTA_StopMinigameTime = Time->currentTime() + MERCHANT_EXPIRE_MINUTES * 60;

    CTheft__UpdateMapIcon();

#if ReleaseSettings::CreateMerchant == 1
    CTheft__CreateMerchant();
#endif

    new message[128];

	SendClientMessageToAllEx(Color::Red, "-------------------------------------------------------------------");
	format(message, sizeof(message), "* Grand Theft Auto: The merchant is desperately in need of the %s marked with the car on your radar",
           VehicleModel(vehicleModel)->nameString());
	SendClientMessageToAllEx(Color::MerchantAnnouncement, message);

	format(message, sizeof(message), "* and is willing to pay $%s to whoever brings it to him. It's located in %s, %s.",
           formatPrice(GTA_Value), GetVehicleZone(GTA_Vehicle), GetVehicleCity(GTA_Vehicle));

	SendClientMessageToAllEx(Color::MerchantAnnouncement, message);
	SendClientMessageToAllEx(Color::Red, "-------------------------------------------------------------------");

	for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
        if (!Player(playerId)->isConnected())
            continue;

        CTheft__UpdateVehicleMarkerForPlayer(playerId);
    }

	format(message, sizeof(message), "[gta] %s %d", VehicleModel(vehicleModel)->nameString(), GTA_Value);
	AddEcho(message);
}

// Returns a random vehicle that the merchant is interested in. The vehicle must meet a series of
// criteria, which are documented through comments within this function's body.
CTheft__ChooseRandomVehicle() {
    new const vehicleCount = VehicleManager->vehicleCount();

    for (new maximumIterations = vehicleCount; maximumIterations > 0; --maximumIterations) {
        new const vehicleId = random(vehicleCount);
        if (!IsValidVehicle(vehicleId))
            continue;

        if (!VehicleModel(GetVehicleModel(vehicleId))->isNitroInjectionAvailable())
            continue;  // vehicles that can't have nitro, e.g. boats and planes, are excluded

        if (GetVehicleVirtualWorld(vehicleId) != 0)
            continue;  // only vehicles in the main world may apply

        new Float: vehicleHealth;
        GetVehicleHealth(vehicleId, vehicleHealth);

        if (vehicleHealth <= 600)
            continue;  // damaged vehicles are excluded.

        return vehicleId;
    }

    return -1;
}

// Stops the Merchant minigame. The |reason| will be send to all players when |sendMessage| is set.
CTheft__End(bool: sendMessage, reason[]) {
    if (GTA_Vehicle == -1)
        return;

	if (sendMessage)
		SendClientMessageToAllEx(Color::MerchantAnnouncement, reason);

    for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
        if (!Player(playerId)->isConnected())
            continue;

        if (GTA_SetVehicleObjective[playerId])
            SetVehicleParamsForPlayer(GTA_Vehicle, playerId, false /* objective */, false /* doorslocked */);

        if (IsPlayerInVehicle(playerId, GTA_Vehicle)) {
            DisablePlayerCheckpoint(playerId);
			RemovePlayerFromVehicle(playerId);
        }
    }

    if (GTA_MapIcon != INVALID_GTA_MAP_ICON)
        DestroyDynamicMapIcon(GTA_MapIcon);

    new const localVehicleId = GTA_Vehicle;

    GTA_Vehicle = -1;
    GTA_MapIcon = INVALID_GTA_MAP_ICON;

    SetVehicleToRespawn(localVehicleId);

    // Disconnect the merchant non-player character after a predetermined amount of time.
    GTA_RemoveMerchantTime = Time->currentTime() + MERCHANT_REMOVAL_DELAY_SECONDS;
}

// -------------------------------------------------------------------------------------------------

// Creates the Merchant NPC. Defined as `stock` because not all builds will include the NPC.
stock CTheft__CreateMerchant() {
    if(GTA_Merchant != Player::InvalidId) {
        Kick(GTA_Merchant);

        GTA_Merchant = Player::InvalidId;
    }

    ConnectNPC("GTA_Merchant", "npcidle");
}

// Called when a non-player character spawns. Positions the player when it's the merchant.
// Defined as `stock` because not all release builds will include the merchant's NPC.
stock CTheft__MaybeMerchantSpawn(playerId, const characterName[]) {
    if (strcmp(characterName, "GTA_Merchant", false, MAX_PLAYER_NAME) != 0)
        return;

    SetPlayerPos(playerId, 974.2247, 2068.2031, 10.8203);
    SetPlayerFacingAngle(playerId, 359.2991);
    SetPlayerSkin(playerId, 28);

    GTA_Merchant = playerId;
}

// Checks the status of the Merchant non-player character. Kicks the NPC when he's no longer needed,
// or applies an animation when he's waiting for the delivery. Called every five seconds.
CTheft__CheckMerchantStatus() {
    if (GTA_RemoveMerchantTime >= Time->currentTime()) {
        if (GTA_Vehicle == -1 /* inactive */ && IsPlayerNPC(GTA_Merchant)) {
            Kick(GTA_Merchant);

            GTA_Merchant = Player::InvalidId;
        }

        GTA_RemoveMerchantTime = -1;
    }

    if (IsPlayerNPC(GTA_Merchant))
        ApplyAnimation(GTA_Merchant, "DEALER", "DEALER_IDLE_01", 4.1, 0, 1, 1, 1, 1, 1);
}

// -------------------------------------------------------------------------------------------------

// Creates or updates the map icon for the GTA Merchant. An existing map icon will be removed first.
CTheft__UpdateMapIcon() {
    if (GTA_Vehicle == -1 || !IsValidVehicle(GTA_Vehicle))
        return;

    if (GTA_MapIcon != INVALID_GTA_MAP_ICON)
        DestroyDynamicMapIcon(GTA_MapIcon);

    new Float: vehicleX, Float: vehicleY, Float: vehicleZ;

    GetVehiclePos(GTA_Vehicle, vehicleX, vehicleY, vehicleZ);

    GTA_MapIcon = CreateDynamicMapIcon(vehicleX, vehicleY, vehicleZ, 55, 0, 0, 0, -1, 99999);
    Streamer_SetIntData(STREAMER_TYPE_MAP_ICON, GTA_MapIcon, E_STREAMER_STYLE, 1);
}

// -------------------------------------------------------------------------------------------------

// Called when the |playerId| enters a vehicle. Displays a delivery advertisement if applicable.
CTheft__EnterVehicle(playerId, vehicleId) {
    if (vehicleId != GTA_Vehicle)
        return;

    ShowBoxForPlayer(playerId, "Deliver the vehicle to the merchant marked red on your radar.");
    SetPlayerCheckpoint(playerId, 967.0427, 2072.9560, 10.8203, 5);
}

// Called when the |playerId| enters a checkpoint. This could be the Merchant's checkpoint.
CTheft__EnterCheckpoint(playerId) {
    if (!IsPlayerInVehicle(playerId, GTA_Vehicle))
        return;

    if (GetPlayerState(playerId) != PLAYER_STATE_DRIVER)
        return;

    new message[128];

    format(message, sizeof(message), "~g~Vehicle delivered!~n~~y~$%s", formatPrice(GTA_Value));
    ShowBoxForPlayer(playerId, message);

    GivePlayerMoney(playerId, GTA_Value);  // economy: GrandTheftAutoRandomVehicleValue

    if (IsPlayerNPC(GTA_Merchant)) {
        SetPlayerChatBubble(GTA_Merchant, "Thanks for delivering the vehicle!", COLOR_LIGHTBLUE, 300, 9999);
        ApplyAnimation(GTA_Merchant, "CLOTHES", "CLO_Buy", 4.1, 0, 1, 1, 1, 1, 1);
        ApplyAnimation(GTA_Merchant, "CLOTHES", "CLO_Buy", 4.1, 0, 1, 1, 1, 1, 1);
    }

    format(message, sizeof(message), "* Grand Theft Auto: %s has delivered the vehicle to the merchant.", Player(playerId)->nicknameString());
    CTheft__End(true /* sendMessage */, message);
}

// Called when a vehicle dies. Finishes the minigame due to the vehicle's destruction if applicable.
CTheft__OnVehicleDeath(vehicleId) {
	if (vehicleId != GTA_Vehicle)
        return;

    CTheft__End(true /* sendMessage */, "* Grand Theft Auto The merchant no longer requires the vehicle as it has been ruined.");
}

// Called when a vehicle spawns. Finishes the minigame due to it respawning if applicable.
CTheft__VehicleSpawn(vehicleId) {
	if (vehicleId != GTA_Vehicle)
        return;

    CTheft__End(true /* sendMessage */, "* Grand Theft Auto: The merchant no longer requires the vehicle as it no longer exists!");
}

// -------------------------------------------------------------------------------------------------

// Makes sure that the GTA vehicle has the objective marker set for the |playerId|. Called every two
// seconds. Removal of the markers will be done by CTheft__End.
//
// Also responsible for updating the map icon's position if the |playerId| happens to be driving the
// merchant vehicle, since that should remain synchronized for other players. This makes sure that
// the position of the player has changed substantially.
CTheft__UpdateVehicleMarkerForPlayer(playerId) {
    if (GTA_Vehicle == -1)
        return;

    if (IsPlayerInVehicle(playerId, GTA_Vehicle) && GetPlayerState(playerId) == PLAYER_STATE_DRIVER) {
        new Float: markerX, Float: markerY, Float: markerZ;

        Streamer_GetFloatData(STREAMER_TYPE_MAP_ICON, GTA_MapIcon, E_STREAMER_X, markerX);
        Streamer_GetFloatData(STREAMER_TYPE_MAP_ICON, GTA_MapIcon, E_STREAMER_Y, markerY);
        Streamer_GetFloatData(STREAMER_TYPE_MAP_ICON, GTA_MapIcon, E_STREAMER_Z, markerZ);

        if (GetVehicleDistanceFromPoint(GTA_Vehicle, markerX, markerY, markerZ) > 10)
            CTheft__UpdateMapIcon();
    }

    if (GTA_SetVehicleObjective[playerId])
        return;

    SetVehicleParamsForPlayer(GTA_Vehicle, playerId, true /* objective */, false /* doorslocked */);
    GTA_SetVehicleObjective[playerId] = true;
}

// Stops the minigame when the merchant has lost interest. Called every ten seconds.
CTheft__CheckMerchantExpireTimer() {
    if (GTA_Vehicle == -1)
        return;

    if (Time->currentTime() < GTA_StopMinigameTime)
        return;

    CTheft__End(true /* sendMessage */, "* Grand Theft Auto: The merchant got tired of waiting and no longer wants the vehicle!");
}

// -------------------------------------------------------------------------------------------------

/**
 * Since I do need a command for debugging on the main server, I decided to add a small class with
 * a command here since that was quick and easy to do.
 *
 * @author Xander "Xanland" Hoogland <home@xanland.nl>
 */
class GrandTheftAutoMerchant {
    /**
     * Brings the developer with administratorrights who executed the command to the place where the
     * GTA Merchant-vehicle should be.
     * It also warns any administrator in-game to prevent a bit of abuse.
     * 
     * @param playerId Id of the player who typed the command.
     * @param params <unused>
     * @command /gotogtamv
     */
    @command("gotogtamv")
    public onGotoGTAMVCommand(playerId, params[]) {
        if (Player(playerId)->isConnected() && Player(playerId)->isAdministrator()) {// && Player(playerId)->isDeveloper()) {
            new Float:vehX, Float:vehY, Float:vehZ,
                message[256];

            GetVehiclePos(GTA_Vehicle, vehX, vehY, vehZ);
            SetPlayerPos(playerId, vehX, vehY, vehZ);

            SendClientMessage(playerId, Color::Success, "You have been moved to the GTA Merchant vehicle. This command may onle be used for debugging purposes! Anyhow: The admins have been notified about this!");
            format(message, sizeof(message), "%s used /gotogtamv for debugging purposes!!!",
                Player(playerId)->nicknameString());
            Admin(playerId, message);
        }

        return 1;

        #pragma unused params
    }
};
