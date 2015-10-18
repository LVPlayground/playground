// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/******************************************************************************

    Las Venturas Playground v2.94 Alpha 4: Anti Teleport cheat

    This script constantly monitors a players position and if they suddenly
    end up a significant fraction away from their previous position, it shows
    an admin message of a possible teleport cheater


    Author: James "Jay" Wilkinson
    30th November 2011


*******************************************************************************/

static  Float:fPlayerPos[MAX_PLAYERS][4];                     // Stores the players position for monitoring. X, Y, Z, Interior
static  iTeleCheatException[MAX_PLAYERS];                     // This variable adds an exception to the anticheat. Used when SetPlayerPos() or OnPlayerSpawn is called
static  iTeleCheatDetectionCount[MAX_PLAYERS];                // Number of tele cheats detected

// Credits to the author of JunkBuster for these co-ords.
// They are co-ords to the teleport locations available to s0beit users.
static Float:fSobeitCheatTeles[46][3]=
{
    {-1935.77, 228.79, 34.16},//Transfender near Wang Cars in Doherty
    {-2707.48, 218.65, 4.93},//Wheel Archangels in Ocean Flats
    {2645.61,-2029.15,14.28},//LowRider Tuning Garage in Willowfield
    {1041.26,-1036.77,32.48},//Transfender in Temple
    {2387.55,1035.70,11.56},//Transfender in come-a-lot
    {1836.93,-1856.28,14.13},//Eight Ball Autos near El Corona
    {2006.11,2292.87,11.57},//Welding Wedding Bomb-workshop in Emerald Isle
    {-1787.25,1202.00,25.84},//Michelles Pay 'n' Spray in Downtown
    {720.10,-470.93,17.07},//Pay 'n' Spray in Dillimore
    {-1420.21,2599.45,56.43},//Pay 'n' Spray in El Quebrados
    {-100.16,1100.79,20.34},//Pay 'n' Spray in Fort Carson
    {2078.44,-1831.44,14.13},//Pay 'n' Spray in Idlewood
    {-2426.89,1036.61,51.14},//Pay 'n' Spray in Juniper Hollow
    {1957.96,2161.96,11.56},//Pay 'n' Spray in Redsands East
    {488.29,-1724.85,12.01},//Pay 'n' Spray in Santa Maria Beach
    {1025.08,-1037.28,32.28},//Pay 'n' Spray in Temple
    {2393.70,1472.80,11.42},//Pay 'n' Spray near Royal Casino
    {-1904.97,268.51,41.04},//Pay 'n' Spray near Wang Cars in Doherty
    {403.58,2486.33,17.23},//Player Garage: Verdant Meadows
    {1578.24,1245.20,11.57},//Player Garage: Las Venturas Airport
    {-2105.79,905.11,77.07},//Player Garage: Calton Heights
    {423.69,2545.99,17.07},//Player Garage: Derdant Meadows
    {785.79,-513.12,17.44},//Player Garage: Dillimore
    {-2027.34,141.02,29.57},//Player Garage: Doherty
    {1698.10,-2095.88,14.29},//Player Garage: El Corona
    {-361.10,1185.23,20.49},//Player Garage: Fort Carson
    {-2463.27,-124.86,26.41},//Player Garage: Hashbury
    {2505.64,-1683.72,14.25},//Player Garage: Johnson House
    {1350.76,-615.56,109.88},//Player Garage: Mulholland
    {2231.64,156.93,27.63},//Player Garage: Palomino Creek
    {-2695.51,810.70,50.57},//Player Garage: Paradiso
    {1293.61,2529.54,11.42},//Player Garage: Prickle Pine
    {1401.34,1903.08,11.99},//Player Garage: Redland West
    {2436.50,698.43,11.60},//Player Garage: Rockshore West
    {322.65,-1780.30,5.55},//Player Garage: Santa Maria Beach
    {917.46,2012.14,11.65},//Player Garage: Whitewood Estates
    {1641.14,-1526.87,14.30},//Commerce Region Loading Bay
    {-1617.58,688.69,-4.50},//San Fierro Police Garage
    {837.05,-1101.93,23.98},//Los Santos Cemetery
    //Positions give to me by SureShot :O
    {-2057.8000,229.9000,35.6204}, // San Fierro
    {-2366.0000,-1667.4000,484.1011}, // Mount Chiliad
    {2503.7000,-1705.8000,13.5480}, // Grove Street
    {1997.9000,1056.3000,10.8203}, // Las Venturas
    {-2872.7000,2712.6001,275.2690}, // BaySide
    {904.1000,608.0000,-32.3281}, // Unterwasser
    {-236.9000,2663.8000,73.6513} // The big Cock
};

TeleportCheatProcess(playerid)
{
    // Is it an actual player?
    if(IsPlayerNPC(playerid))
    {
        return;
    }

    // If this is the first position calculation thingie then we're done here.
    if(fPlayerPos[playerid][0] == 0 && fPlayerPos[playerid][1] == 0 && fPlayerPos[playerid][2] == 0)
    {
        GetPlayerPos(playerid, fPlayerPos[playerid][0], fPlayerPos[playerid][1], fPlayerPos[playerid][2]);
        fPlayerPos[playerid][3] = GetPlayerInterior(playerid);
        return;
    }

    // If an exception is added, don't proceed.
    if(iTeleCheatException[playerid] > 0)
    {
        iTeleCheatException[playerid]--;
        GetPlayerPos(playerid, fPlayerPos[playerid][0], fPlayerPos[playerid][1], fPlayerPos[playerid][2]);
        fPlayerPos[playerid][3] = GetPlayerInterior(playerid);
        return;
    }

    // Exception for players spectating
    if(GetPlayerState(playerid) == PLAYER_STATE_SPECTATING)
    {
        GetPlayerPos(playerid, fPlayerPos[playerid][0], fPlayerPos[playerid][1], fPlayerPos[playerid][2]);
        fPlayerPos[playerid][3] = GetPlayerInterior(playerid);
        return;
    }

    new Float:fTeleDistance = GetPlayerDistanceFromPoint(playerid, fPlayerPos[playerid][0], fPlayerPos[playerid][1], fPlayerPos[playerid][2]);

    if(fTeleDistance >= 350)
    {
        iTeleCheatDetectionCount[playerid]++;

        if(IsPlayerInRangeOfCheatPosition(playerid, 3.0))
        {
            new szAdminMsg[128];

            iTeleCheatDetectionCount[playerid]++;

            format(szAdminMsg, 128, "%s (Id:%d) teleported to s0beit teleport location #%d.", PlayerName(playerid), playerid, iTeleCheatDetectionCount[playerid]);
            Admin(playerid, szAdminMsg);
        }
    }

    GetPlayerPos(playerid, fPlayerPos[playerid][0], fPlayerPos[playerid][1], fPlayerPos[playerid][2]);
    fPlayerPos[playerid][3] = GetPlayerInterior(playerid);
}

// Adds an exception to the teleport cheat detection. Used in SetPlayerPos and OnPlayerSpawn.
TeleportCheatAddException(playerid, iExceptions = 3)
{
    iTeleCheatException[playerid] += iExceptions;
}

// Called from OnPlayerDisconnect to reset the cheat data so the new player ID doesn't get the previous IDs shizzle
ResetTeleCheatData(playerid)
{
    iTeleCheatException[playerid] = 0;
    iTeleCheatDetectionCount[playerid] = 0;
    for(new i = 0; i < 4; i++)
    {
        fPlayerPos[playerid][i] = 0;
    }
}

// This function returns 1 if a player is within range of one of the teleport positions which
// are available in s0beit. Credits to the junkbuster author for the co-ords.
IsPlayerInRangeOfCheatPosition(playerid, Float:range)
{
    for(new i = 0; i < sizeof(fSobeitCheatTeles); i++)
    {
        if(IsPlayerInRangeOfPoint(playerid, range, fSobeitCheatTeles[i][0],fSobeitCheatTeles[i][1],fSobeitCheatTeles[i][2]))
        {
            return 1;
        }
    }
    return 0;
}
