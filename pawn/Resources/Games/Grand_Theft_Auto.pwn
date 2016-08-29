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
*           Author: Jay             wilkinson_929@hotmail.com                  *
*******************************************************************************/

// Defines:
#define MINUTES_TO_DELIVER 15        // How long does everyone get to deliver it?
#define COLOR_GTA 0x33FF33AA      // The color used throughout this minigame

#define INVALID_GTA_MAP_ICON (DynamicMapIcon: -1)

new    GTA_Vehicle;                 // The current wanted vehicle.
new    GTA_Value;                   // The value the vehicle is worth
new    GTA_Time;                    // How long has the game been running for?
new    GTA_Vparams[MAX_PLAYERS];          // Is the GTA Vehicle params showing for the player?
new    DynamicMapIcon: GTA_MapIcon = INVALID_GTA_MAP_ICON; // Stores the map icon ID
new    GTA_NPCID = Player::InvalidId;   // NPC player id
new    GTA_EndTime = -1;                     // Stores the time the game ended so we can destroy the NPC 15 seconds after

// CTheft__Begin
// this function sets the required vars for the Grand Theft Auto minigame
CTheft__Begin()
{
	GTA_Vehicle = -1;
}

// CTheft__Initialize. This function intializes the Grand Theft Auto
// minigame and is called every hour or so.
CTheft__Initalize()
{
	CTheft__End(false /* sendMessage */, "");

	new str[256];


	GTA_Vehicle = CTheft__ChooseRandomVehicle();
	GTA_Value = GetEconomyValue(GrandTheftAutoRandomVehicleValue);

    new vehicleModel = GetVehicleModel(GTA_Vehicle);

    if (VehicleModel->isValidVehicleModel(vehicleModel) == false)
        return; /** prevent buffer overflows **/

    #if ReleaseSettings::CreateMerchant == 1
		if(GTA_NPCID != Player::InvalidId)
		{
		    Kick(GTA_NPCID);
		    GTA_NPCID = Player::InvalidId;
		}

		ConnectNPC("GTA_Merchant", "npcidle");
	#endif

	SendClientMessageToAllEx(Color::Red,"-------------------------------------------------------------------");
	format(str,256,"* Grand Theft Auto: The merchant is desperately in need of the %s marked with the car on your radar", VehicleModel(vehicleModel)->nameString());
	SendClientMessageToAllEx(COLOR_GTA,str);
	format(str,256,"* and is willing to pay $%s to whoever brings it to him. It's located in %s, %s.",formatPrice(GTA_Value), GetVehicleZone(GTA_Vehicle), GetVehicleCity(GTA_Vehicle));
	SendClientMessageToAllEx(COLOR_GTA,str);
	SendClientMessageToAllEx(Color::Red,"-------------------------------------------------------------------");
	GTA_Time = Time->currentTime();

	for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
	{
	    if(!Player(i)->isConnected()) continue;
	    if(IsPlayerInMinigame(i)) continue;
		if(GetPlayerVirtualWorld(i) != 0) continue;
		CTheft__SetParams(i,true);
	}

	format(str,256,"[gta] %s %d", VehicleModel(vehicleModel)->nameString(), GTA_Value);
	AddEcho(str);
}

#if ReleaseSettings::CreateMerchant == 1

// CTheft__CheckNPCSpawn
// This is called from SpawnNPCs to
// position our GTA Merchant NPC
CTheft__CheckNPCSpawn(playerid, szPlayerName[])
{
	if(!strcmp(szPlayerName, "GTA_Merchant", false, MAX_PLAYER_NAME))
	{
	    GTA_NPCID = playerid;
	    SetPlayerPos(GTA_NPCID, 974.2247, 2068.2031, 10.8203);
	    SetPlayerFacingAngle(GTA_NPCID, 359.2991);
	    SetPlayerSkin(GTA_NPCID, 28);
	}
}

#endif

// -------------------------------------------------------------------------------------------------

// Called when the |playerId| enters a vehicle. Displays a delivery advertisement if applicable.
CTheft__EnterVehicle(playerId, vehicleId) {
    if (vehicleId != GTA_Vehicle)
        return;

    ShowBoxForPlayer(playerId, "Deliver the vehicle to the merchant marked red on your radar.");
    SetPlayerCheckpoint(playerId, 967.0427, 2072.9560, 10.8203, 5);
}

// Called when a vehicle dies. Finishes the minigame due to the vehicle's destruction if applicable.
CTheft__OnVehicleDeath(vehicleId) {
	if(vehicleId != GTA_Vehicle)
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

// CTheft__End
// this function ends the vehicle theft minigame with a reason and option to send
// the reason to everyone.
CTheft__End(bool: sendMessage, reason[])
{
	if(GTA_Vehicle == -1)
	{
		return 0;
	}

	if(sendMessage)
		SendClientMessageToAllEx(COLOR_GTA,reason);

	// now we have to inform the player who was driving the vehicle it was over and
	// disable his checkpoint, along with removing the vehicle objective for everyone else.
	for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
	{
		if(IsPlayerInVehicle(i,GTA_Vehicle))
		{
		    DisablePlayerCheckpoint(i);
			RemovePlayerFromVehicle(i);
		}
	    CTheft__SetParams(i,false);
	}

	// Important: the GTA_Vehicle variable must be set to -1
	// before we respawn the vehicle, otherwise CTheft__Spawn
	// will attempt to end it and it will create an unlimited loop.
	new iTempVehID = GTA_Vehicle;
	GTA_Vehicle = -1;
	SetVehicleToRespawn(iTempVehID);

	if(GTA_MapIcon != INVALID_GTA_MAP_ICON)
	{
	    DestroyDynamicMapIcon(GTA_MapIcon);
	}

	// Store the time the minigame ended so we can destroy the NPC later
	GTA_EndTime = Time->currentTime();
	return 1;
}
// CTheft__Process
// this is called every second from lvp's main timer, and if GTA is in progress
// it places a map icon over the car and shows it for every player.
CTheft__Process(i)
{
	if(GTA_Vehicle > -1)
	{
		// If more than 5 minutes have passed, we end it.
		if(GTA_Time - Time->currentTime() > MINUTES_TO_DELIVER*60*1000)
		{
			return CTheft__End(true /* sendMessage */, "* Grand Theft Auto: The merchant got tired of waiting and no longer wants the vehicle!");
		}

		new
		    Float:x,
		    Float:y,
		    Float:z;

		GetVehiclePos(GTA_Vehicle,x,y,z);


		if(GetPlayerVirtualWorld(i) == 0 && !IsPlayerInMinigame(i))
		{
			CTheft__SetParams(i,true);
		}
		else
		{
			CTheft__SetParams(i,false);
		}

		// Right then we may need to update the position of the map icon, or even create it.
		if(GTA_Vparams[i])
		{
			if(GTA_MapIcon != INVALID_GTA_MAP_ICON)
			{
				Streamer_SetFloatData(STREAMER_TYPE_MAP_ICON, GTA_MapIcon, E_STREAMER_X, x);
				Streamer_SetFloatData(STREAMER_TYPE_MAP_ICON, GTA_MapIcon, E_STREAMER_Y, y);
				Streamer_SetFloatData(STREAMER_TYPE_MAP_ICON, GTA_MapIcon, E_STREAMER_Z, z);
				Streamer_Update(i);
			}
			else
			{   // Show this as a global map icon.
	        	GTA_MapIcon = CreateDynamicMapIcon(x, y, z, 55, 0, 0, 0, -1, 99999);
			   	Streamer_SetIntData(STREAMER_TYPE_MAP_ICON, GTA_MapIcon, E_STREAMER_STYLE, 1);
			}
		}


	}
	return 1;
}

CTheft__CheckNPCKick()
{
	if(GTA_EndTime != -1 && GTA_Vehicle == -1)
	{
	    if(Time->currentTime() - GTA_EndTime > 20)
	    {
			if(IsPlayerConnected(GTA_NPCID) && IsPlayerNPC(GTA_NPCID))
			{
				Kick(GTA_NPCID); // valid Kick() usage.
			}
			GTA_NPCID = Player::InvalidId;
			GTA_EndTime = -1;
	    }
	}
	if(IsPlayerConnected(GTA_NPCID) && IsPlayerNPC(GTA_NPCID))
	{
		ApplyAnimation(GTA_NPCID, "DEALER", "DEALER_IDLE_01", 4.1, 0, 1, 1, 1, 1, 1);
	}
}


// CTheft__ChooseRandomVehicle
// Prior to the game starting we have to choose a random vehicle.
// Certain exceptions apply of course so that things like boats and planes etc
// are not chosen.
CTheft__ChooseRandomVehicle()
{
    new iVehicleCount = VehicleManager->vehicleCount();
	new iChosenVehicleID = Vehicle::InvalidId;

	// Stores vehicle IDs that have already been looped through
	new iCurrentVehicleID = iVehicleCount;

	while(iChosenVehicleID == Vehicle::InvalidId)
	{
        if (iCurrentVehicleID <= 1)
            return 1;

	    new iRandomVeh = random(iCurrentVehicleID);

	    new Float:fVehHealth;
	    GetVehicleHealth(iRandomVeh, fVehHealth);

	    if (iRandomVeh != Vehicle::InvalidId && VehicleModel(GetVehicleModel(iRandomVeh))->isNitroInjectionAvailable()
		&& fVehHealth > 600 && GetVehicleVirtualWorld(iRandomVeh) == 0 && !IsVehicleLocked(iRandomVeh)
		&& Vehicle(iRandomVeh)->isAdministratorVehicle() == false && Vehicle(iRandomVeh)->isVeryImportantPlayerVehicle() == false)
		{
		    iChosenVehicleID = iRandomVeh;
			break;
		}
	    // Prevent the random() function from choosing this particular vehicle ID again
	    iCurrentVehicleID--;
	}

	return iChosenVehicleID;
}

// CTheft__Checkpoint
// this function manages the process of when the player enters the checkpoint.
CTheft__Checkpoint(playerid)
{
	if(GTA_Vehicle > -1 && IsPlayerInVehicle(playerid,GTA_Vehicle) && GetPlayerState(playerid) == PLAYER_STATE_DRIVER)
	{
		new str[256];
		format(str,256,"~g~Vehicle delivered!~n~~y~$%d",GTA_Value);
		ShowBoxForPlayer(playerid, str);
		GivePlayerMoney(playerid, GTA_Value);  // economy: GrandTheftAutoRandomVehicleValue
		format(str,256,"* Grand Theft Auto: %s has delivered the vehicle to the merchant.",PlayerName(playerid));
		CTheft__End(true /* sendMessage */, str);
		SetPlayerChatBubble(GTA_NPCID, "Thanks for delivering the vehicle!", COLOR_LIGHTBLUE, 300, 9999);
		ApplyAnimation(GTA_NPCID, "CLOTHES", "CLO_Buy", 4.1, 0, 1, 1, 1, 1, 1);
		ApplyAnimation(GTA_NPCID, "CLOTHES", "CLO_Buy", 4.1, 0, 1, 1, 1, 1, 1);
    }
	return 1;
}

// CTheft__SetParams
// this function manages the vehicle params for the player
// on the GTA Vehicle.
CTheft__SetParams(playerid,bool:show)
{
	if(GTA_Vehicle == -1) return 0;

	if(show == true && !GTA_Vparams[playerid])
	{
		GTA_Vparams[playerid] = true;
		SetVehicleParamsForPlayer(GTA_Vehicle,playerid,true,false);
	}
	else
	{
		if(show == false && GTA_Vparams[playerid])
		{
	    	GTA_Vparams[playerid] = false;
	    	SetVehicleParamsForPlayer(GTA_Vehicle,playerid,false,false);
			DestroyDynamicMapIcon(GTA_MapIcon);
			GTA_MapIcon = INVALID_GTA_MAP_ICON;
		}
	}
	return 1;
}

// End of Grand Theft Auto! Thankyou for viewing another fine piece of work
// by Jay! <3

LegacyGetGtaVehicleId() {
    return GTA_Vehicle;
}

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
            new currentveh = LegacyGetGtaVehicleId(),
                Float:vehX, Float:vehY, Float:vehZ,
                message[256];

            GetVehiclePos(currentveh, vehX, vehY, vehZ);
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