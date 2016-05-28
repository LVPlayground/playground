// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/********************************************************************************
*                                                                               *
*  Las Venturas Playground v2.94 - 26/03/2011                                   *
*                                                                               *
*  New feature for 2.94 - Spray Tags. Similar to that of Singleplayer,          *
*  Players spawn with a spray can object and can spray over various tags        *
*  around LV. there will be 100 tags. For anyone whos sprays all tags, they     *
*  will get a reward of being able to spawn an infernus using a command: /inf!  *
*                                                                               *
*  @copyright Copyright (c) 2006-2011 Las Venturas Playground                   *
*  @author    Jay                                                               *
*  @package   Handlers                                                          *
*  @version   $Id: SprayTags.pwn 5123 2015-09-04 23:06:44Z Xanland $                                                              *
*                                                                               *
********************************************************************************/

#define     SPRAY_TAG_OBJECT            18664                   // The untagged object ID
#define     SPRAY_TAGGED_OBJECT         18659                   // The tagged object id

#define     SPRAY_TAG_RANGE             3.0                     // The range the player has to be in to spray a tag

#define     MAX_SPRAY_TAGS              100                     // Maximum number of spray tags

#define     SPRAY_TAG_STREAM_RANGE      125                     // This should be kept as low as possible so calculations aren't too intense

#define     SPRAY_TAG_TABLE_NAME        "spraytags"             // MySQL table name

new      n_PlayerTagsSprayed[MAX_PLAYERS][MAX_SPRAY_TAGS]; // Flag to determine which player has sprayed which tag

new      n_SprayTagCount;                            // How many spray tags are loaded

new      n_TagsPlayerSprayed[MAX_PLAYERS];                 // Number of tags a player has sprayed

new      iSprayCanTime[MAX_PLAYERS];                       // Stores the time in which a player begins to spray and ends.

new      sprayTagPlayerVehicle[MAX_PLAYERS] = {Vehicle::InvalidId, ...};                // Stores the vehicle ID for the spawned vehicle, which is the reward a player gets for collecting all 100 tags.

// This variable stores when the player has last used the inf command
// We only allow players to spawn infernuses every 3 minutes to prevent abuse
new g_iTimeInfCommandLastUsed[MAX_PLAYERS];       

enum    E_SPRAY_TAG
{
    Float:fSprayPosX,
    Float:fSprayPosY,
    Float:fSprayPosZ,
    Float:fSprayRotX,
    Float:fSprayRotY,
    Float:fSprayRotZ,
    DynamicObject: fSprayObjectID[MAX_PLAYERS]

}
new sprayTag[MAX_SPRAY_TAGS][E_SPRAY_TAG];


enum SprayTagVehicle {
    SPRAY_TAG_ELEGY,
    SPRAY_TAG_INFERNUS,
    SPRAY_TAG_NRG,
    SPRAY_TAG_SULTAN,
    SPRAY_TAG_TURISMO,
    SPRAY_TAG_VORTEX
};

//-------------------

// Initialize all the spray tags - called from OnGameModeInit
sprayTagInitialize()
{

    sprayTagCreate(2064.62, 1777.68, 10.81, 0.00, 0.00, 153.00);
    sprayTagCreate(2351.03, 2248.53, 10.81, 0.00, 0.00, 90.00);
    sprayTagCreate(2322.33, 2503.80, 11.31, 0.00, 0.00, 270.00);
    sprayTagCreate(1869.46, 2390.62, 11.11, 0.00, 0.00, 90.00);
    sprayTagCreate( 1917.10, 2725.32, 10.82, 0.00, 0.00, 0.00);
    sprayTagCreate( 1499.28, 2647.79, 11.12, 0.00, 0.00, -270.00);
    sprayTagCreate( 1828.86, 2474.45, 9.94, 0.00, 0.00, 288.00);
    sprayTagCreate( 1285.90, 2374.56, 8.93, 0.00, 0.00, -22.00);
    sprayTagCreate( 1145.18, 2223.19, 11.32, 0.00, 0.00, 90.00);
    sprayTagCreate( 1041.81, 1766.39, 13.40, 0.00, 0.00, 0.00);
    sprayTagCreate( 1057.29, 1247.99, 10.82, 0.00, 0.00, 180.00);
    sprayTagCreate( 1463.24, 1029.85, 10.91, 0.00, 0.00, 180.00);
    sprayTagCreate( 1591.58, 1085.78, 11.12, 0.00, 0.00, 0.00);
    sprayTagCreate( 2414.73, 1726.83, 10.82, 0.00, 0.00, 130.00);
    sprayTagCreate( 2311.47, 1802.09, 11.12, 0.00, 0.00, 90.00);
    sprayTagCreate( 1676.39, 1434.13, 10.98, 0.00, 0.00, 0.00);
    sprayTagCreate( 1625.07, 1386.00, 11.01, 0.00, 0.00, 40.00);
    sprayTagCreate( 2174.21, 1416.36, 11.56, 0.00, 0.00, 0.00);
    sprayTagCreate( 2639.06, 1878.68, 11.22, 0.00, 0.00, 0.00);
    sprayTagCreate( 2573.44, 2042.46, 11.10, 0.00, 0.00, 220.00);
    sprayTagCreate( 2621.09, 2185.88, 14.21, 0.00, 0.00, 90.00);
    sprayTagCreate( 2615.13, 2420.12, 11.02, 0.00, 0.00, 90.00);
    sprayTagCreate( 1896.41, 721.68, 11.02, 0.00, 0.00, 180.00);
    sprayTagCreate( 1587.36, 1746.15, 11.02, 0.00, 0.00, 0.00);
    sprayTagCreate( 2653.89, 1080.64, 10.82, 0.00, 0.00, 270.00);
    sprayTagCreate( 1521.66, 2542.47, 10.82, 0.00, 0.00, 180.00);
    sprayTagCreate( 2626.51, 2410.48, 12.78, 0.00, 0.00, 180.00);
    sprayTagCreate( 1460.02, 750.86, 29.00, 0.00, 0.00, 180.00);
    sprayTagCreate( 2910.56, 2485.91, 11.82, 1.00, 0.00, 226.60);
    sprayTagCreate( 2412.56, 1383.18, 11.32, 1.00, 1.00, -269.00);
    sprayTagCreate( 2084.87, 638.54, 12.15, 0.00, 0.00, 450.00);
    sprayTagCreate( 2245.89, 961.58, 16.93, 0.00, 0.00, 90.00);
    sprayTagCreate( 2242.43, 1129.93, 11.32, 0.00, 0.00, 604.00);
    sprayTagCreate( 2154.13, 1074.52, 11.60, 0.00, 0.00, 140.00);
    sprayTagCreate( 2411.89, 2123.31, 10.82, 0.00, 0.00, 630.00);
    sprayTagCreate( 2362.18, 740.97, 11.86, 0.00, 0.00, 90.00);
    sprayTagCreate( 1652.71, 2750.41, 10.82, 0.00, 0.00, 90.00);
    sprayTagCreate( 2565.65, 1553.54, 10.72, 0.00, 0.00, 90.00);
    sprayTagCreate( 2577.70, 1399.43, 11.54, 0.00, -1.00, 90.00);
    sprayTagCreate( 2472.47, 1140.51, 10.82, 0.00, 0.00, 180.00);
    sprayTagCreate( 2208.02, 680.47, 12.06, 0.00, 0.00, 90.00);
    sprayTagCreate( 2203.66, 2551.67, 10.82, 0.00, 0.00, 270.00);
    sprayTagCreate( 1796.64, 1131.81, 7.23, 0.00, 0.00, 0.00);
    sprayTagCreate( 2854.49, 1246.65, 18.39, 0.00, 0.00, 180.00);
    sprayTagCreate( 1277.03, 844.72, 26.39, 0.00, 0.00, 131.94);
    sprayTagCreate( 977.79, 1014.14, 10.82, 0.00, 0.00, 40.00);
    sprayTagCreate( 2035.49, 2250.71, 10.82, 0.00, 0.00, 180.00);
    sprayTagCreate( 1082.54, 1599.46, 6.82, 0.00, 0.00, 280.00);
    sprayTagCreate( 2873.44, 1605.19, 11.37, 0.00, 0.00, 180.00);
    sprayTagCreate( 1017.92, 2216.87, 10.77, 0.00, 0.00, 180.00);
    sprayTagCreate( 860.41, 2406.13, 20.19, 0.00, 0.00, 65.00);
    sprayTagCreate( 1982.30, 1076.60, 11.32, 0.00, 0.00, 270.00);
    sprayTagCreate( 1437.71, 2812.57, 10.82, 0.00, 0.00, 0.00);
    sprayTagCreate( 2930.86, 2119.44, 18.77, 0.00, 0.00, 180.00);
    sprayTagCreate( 1958.74, 1324.25, 9.25, 0.00, 0.00, 180.00);
    sprayTagCreate( 2556.28, 2324.14, 3.98, 0.00, 0.00, 2.00);
    sprayTagCreate( 1896.99, 2448.84, 11.67, 0.00, 0.00, 90.00);
    sprayTagCreate( 1774.07, 886.46, 27.38, 0.00, 0.00, 52.74);
    sprayTagCreate( 1373.51, 1038.62, 10.82, 0.00, 0.00, 180.00);
    sprayTagCreate( 2140.38, 2707.53, 11.32, 0.00, 0.00, 90.00);
    sprayTagCreate( 2802.37, 884.95, 17.98, 0.00, 0.00, 0.00);
    sprayTagCreate( 2888.02, 1004.18, 11.27, 0.00, 0.00, 180.00);
    sprayTagCreate( 1187.41, 2054.94, 9.53, 0.00, 0.00, 180.00);
    sprayTagCreate( 2601.19, 783.36, 5.31, 0.00, 0.00, 270.00);
    sprayTagCreate( 2207.41, 1296.08, 11.32, 0.00, 0.00, 90.00);
    sprayTagCreate( 1414.03, 2190.56, 12.01, 0.00, -3.00, 0.00);
    sprayTagCreate( 2254.19, 501.35, 17.77, 0.00, 9.00, 180.00);
    sprayTagCreate( 1569.82, 842.47, 7.76, 0.00, -3.00, 90.00);
    sprayTagCreate( 1218.34, 928.36, 9.61, 0.00, 0.00, -59.00);
    sprayTagCreate( 1216.70, 1192.68, 7.81, 0.00, -6.00, 0.00);
    sprayTagCreate( 2110.61, 2061.80, 46.19, 0.00, 0.00, 90.00);
    sprayTagCreate( 2116.39, 2424.48, 28.62, 0.00, 0.00, 0.00);
    sprayTagCreate( 1187.48, 1812.99, 9.55, 0.00, 0.00, 180.00);
    sprayTagCreate( 2144.20, 2830.71, 10.82, 0.00, 0.00, 270.00);
    sprayTagCreate( 2529.21, 2851.86, 11.32, 0.00, 0.00, 180.00);
    sprayTagCreate( 1936.91, 950.89, 11.32, 0.00, 0.00, 0.00);
    sprayTagCreate( 2410.18, 2760.65, 10.82, 0.00, 0.00, 90.00);
    sprayTagCreate( 1887.20, 1183.20, 11.32, 0.00, 0.00, 90.00);
    sprayTagCreate( 2584.46, 2700.43, 13.82, 0.00, 0.00, 180.00);
    sprayTagCreate( 2399.00, 2540.62, 22.27, 0.00, 0.00, 180.00);
    sprayTagCreate( 1840.39, 2096.25, 11.32, 0.00, 0.00, 90.00);
    sprayTagCreate( 2662.65, 1192.93, 24.08, 0.00, 0.00, 90.00);
    sprayTagCreate( 1674.64, 2092.95, 11.96, 0.00, 0.00, 0.00);
    sprayTagCreate( 2266.14, 1621.36, 95.42, 0.00, 0.00, 270.00);
    sprayTagCreate( 1749.19, 2246.46, 10.82, 0.00, 0.00, 90.00);
    sprayTagCreate( 1691.97, 2206.01, 14.86, 0.00, 0.00, -90.00);
    sprayTagCreate( 785.51, 1686.29, 5.98, 0.00, 0.00, 0.00);
    sprayTagCreate( 676.50, 1704.96, 7.43, 0.00, 0.00, 45.00);
    sprayTagCreate( 708.82, 1968.78, 6.03, 0.00, 0.00, 90.00);
    sprayTagCreate( 785.13, 2066.79, 6.91, 0.00, 0.00, 0.00);
    sprayTagCreate( 699.69, 2364.10, 19.90, 0.00, 0.00, -45.00);
    sprayTagCreate( 2470.84, 1552.17, 10.82, 0.00, 0.00, 180.00);
    sprayTagCreate( 1194.26, 1460.76, 24.30, 0.00, 0.00, 178.00);
    sprayTagCreate( 1064.11, 2954.56, 10.16, -4.00, 29.70, -101.00);
    sprayTagCreate( 1364.21, 1909.97, 10.92, 0.00, 0.00, -90.00);
    sprayTagCreate( 2046.63, 2011.24, 11.17, 0.00, 0.00, 90.00);
    sprayTagCreate( 2211.11, 1571.59, 11.42, 0.00, 0.00, 90.00);
    sprayTagCreate( 1950.63, 2319.66, 17.05, 0.00, 0.00, 0.00);
    sprayTagCreate( 1858.98, 2115.32, 29.42, 0.00, 0.00, 90.00);
    sprayTagCreate( 1676.43, 1457.38, 15.51, 0.00, 0.00, 0.00);


    if (sprayTagGetCount() == 0)
        printf("[SprayTagController] ERROR: Could not load any spray tags.");
}


// Create our actual spray tag at the given co-ords
sprayTagCreate(Float:fPosX, Float:fPosY, Float:fPosZ, Float:fRotX, Float:fRotY, Float:fRotZ)
{
    if(sprayTagGetCount() >= MAX_SPRAY_TAGS)
    {
        printf("[SprayTagController] ERROR: Unable to create spray tag at position: %f, %f, %f: limit reached.", fPosX, fPosY, fPosZ);
        return;
    }

    new iTagID = sprayTagGetCount();

    sprayTag[iTagID][fSprayPosX] = fPosX;
    sprayTag[iTagID][fSprayPosY] = fPosY;
    sprayTag[iTagID][fSprayPosZ] = fPosZ;

    // Might not be necessary to store the rotation co-ords, this needs checking.
    sprayTag[iTagID][fSprayRotX] = fRotX;
    sprayTag[iTagID][fSprayRotY] = fRotY;
    sprayTag[iTagID][fSprayRotZ] = fRotZ;

    // Spray tags are per-player objects. We handle creation in sprayTagUpdateForPlayer.
//  sprayTag[iTagID][fSprayObjectID] = CreateDynamicObject(SPRAY_TAG_OBJECT, fPosX, fPosY, fPosZ, fRotX, fRotY, fRotZ, 0, 0, -1, SPRAY_TAG_STREAM_RANGE);

    n_SprayTagCount++;


    // If this is a BETA test show the location of the spray tag.
    #if BETA_TEST == 1
        CreateDynamicMapIcon(fPosX, fPosY, fPosZ, 63, 0, 0, 0, -1, 400);
    #endif
}

// Return the number of spray tags loaded in the server
sprayTagGetCount()
{
    return n_SprayTagCount;
}

// Return the number of tags a player has sprayed
sprayTagGetPlayerCount(playerid)
{
    return n_TagsPlayerSprayed[playerid];
}

// Return vehicle id of the /inf car a player is driving
sprayTagGetPlayerVehicleid(playerid)
{
    return sprayTagPlayerVehicle[playerid];
}

sprayTagHasPlayerSprayedAll(playerid)
{
    if(sprayTagGetPlayerCount(playerid) == sprayTagGetCount())
    {
        return 1;
    }
    return 0;
}

// This is called from OnPlayerConnect and
// updates all spray tags for a player by setting them as either
// sprayed or not.
sprayTagUpdateForPlayer(playerid)
{
    // We'll re-calculate the number of tags the player has sprayed here too.
    n_TagsPlayerSprayed[playerid] = 0;

    for(new i = 0; i < sprayTagGetCount(); i++)
    {
        new n_ObjectID;

        if(sprayTagHasPlayerSprayedTag(playerid, i) == 1)
        {
            n_ObjectID = SPRAY_TAGGED_OBJECT;

            // Increase the number of sprayed tags
            n_TagsPlayerSprayed[playerid]++;
        }
        else
        {
            n_ObjectID = SPRAY_TAG_OBJECT;
        }

        if(IsValidDynamicObject(sprayTag[i][fSprayObjectID][playerid]))
        {
            DestroyDynamicObject(sprayTag[i][fSprayObjectID][playerid]);
        }

        sprayTag[i][fSprayObjectID][playerid] = CreateDynamicObject(n_ObjectID, sprayTag[i][fSprayPosX], sprayTag[i][fSprayPosY], sprayTag[i][fSprayPosZ], sprayTag[i][fSprayRotX], sprayTag[i][fSprayRotY], sprayTag[i][fSprayRotZ], 0, 0, playerid, SPRAY_TAG_STREAM_RANGE);
    }
    Streamer_Update(playerid);
}

// This function is called from OnPlayerDisconnect
// to reset all relevant data
sprayTagResetData(playerid)
{
    for(new i = 0; i < sprayTagGetCount(); i++)
    {
        n_PlayerTagsSprayed[playerid][i] = 0;
        DestroyDynamicObject(sprayTag[i][fSprayObjectID][playerid]);
        sprayTag[i][fSprayObjectID][playerid] = DynamicObject: INVALID_OBJECT_ID;
    }

    n_TagsPlayerSprayed[playerid] = 0;
    iSprayCanTime[playerid] = 0;

    if(sprayTagPlayerVehicle[playerid] != Vehicle::InvalidId)
    {
        VehicleManager->destroyVehicle(sprayTagPlayerVehicle[playerid]);
        sprayTagPlayerVehicle[playerid] = Vehicle::InvalidId;
    }
}

// This is called when a player sprays a spray tag
// and updates all relevant information
sprayTagOnPlayerSpray(playerid, tagid)
{
    if(!Player(playerid)->isConnected() || tagid < 0 || tagid > MAX_SPRAY_TAGS || sprayTagHasPlayerSprayedTag(playerid, tagid))
        return;

    // Save the sprayed tag data to the players profile so
    // that this tag saves as being sprayed when they reconnect in future.
    if (Player(playerid)->isRegistered() && Player(playerid)->isLoggedIn()) {
        new query[128];
        format(query, sizeof(query), "INSERT INTO %s (tag_id, profile_id) VALUES (%d, %d)",
            SPRAY_TAG_TABLE_NAME, tagid, Account(playerid)->userId());
        Database->query(query, "", -1);
    }

    // Alright, we simply have to update the spray tag object model using the streamers internal Streamer_SetIntData native
    Streamer_SetIntData(STREAMER_TYPE_OBJECT, sprayTag[tagid][fSprayObjectID][playerid], E_STREAMER_MODEL_ID, SPRAY_TAGGED_OBJECT);
    Streamer_Update(playerid);

    n_PlayerTagsSprayed[playerid][tagid] = true;
    iSprayCanTime[playerid] = 0;

    n_TagsPlayerSprayed[playerid]++;

    new szGameTextMsg[128];

    if(!sprayTagHasPlayerSprayedAll(playerid))  // Player has not sprayed every tag.
    {
        format(szGameTextMsg, 128, "%d/%d Tags Sprayed!", n_TagsPlayerSprayed[playerid], sprayTagGetCount());
        GameTextForPlayer(playerid, szGameTextMsg, 5000, 3);

        CAchieve__SprayTag(playerid);
    }
    else    // The player has sprayed every tag! Yey! Unlock the cmd etc
    {
        // Do the achievement first so the gametext message does not get in the way.
        CAchieve__SprayTag(playerid);

        format(szGameTextMsg, 128, "~n~~g~%d/%d Tags Sprayed!~n~~n~~w~You have sprayed every tag. ~n~~b~You have access to spawn vehicles!", n_TagsPlayerSprayed[playerid], sprayTagGetCount());
        GameTextForPlayer(playerid, szGameTextMsg, 5000, 3);

        SendClientMessage(playerid, COLOR_YELLOW, "* You can now use /inf, /nrg, /ele, /sul, /tur and /vor to spawn a vehicle whenever you want!");

        new szNewsMsg[128];
        format(szNewsMsg, 128, "~r~~h~%s~w~ has sprayed all ~y~%d~w~ spraytags and unlocked ability to spawn vehicles!",
            Player(playerid)->nicknameString(), sprayTagGetCount());
        NewsController->show(szNewsMsg);
    }




    PlayerPlaySound(playerid, 1137, 0, 0, 0);
}


// Returns 1 if a player has sprayed the specified tag ID, otherwise 0.
sprayTagHasPlayerSprayedTag(playerid, tagid)
{
    if(tagid < 0 || tagid > MAX_SPRAY_TAGS)
        return 0;

    return n_PlayerTagsSprayed[playerid][tagid];
}

// This is called from OnPlayerKeyStateChange
// and is used to check when a player sprays a spray tag
sprayTagOnKeyStateChange(playerid, newkeys, oldkeys)
{
    if(GetPlayerWeapon(playerid) != WEAPON_SPRAYCAN)
    {
        return 0;
    }

    if(GetPlayerVirtualWorld(playerid) != 0)
    {
        return 0;
    }

    if(GetPlayerState(playerid) != PLAYER_STATE_ONFOOT)
    {
        return 0;
    }

    if(GetPlayerWeaponState(playerid) == WEAPONSTATE_RELOADING)
    {
        return 0;
    }

    // Alright, now we only spray the tag when they have been spraying it for
    // 2 seconds or more.
    if(PRESSED(KEY_FIRE))   // Player has pressed fire - store the time.
    {
        iSprayCanTime[playerid] = GetTickCount();
        return 0;   // return 0 so the rest of the OnPlayerKeyStateChange callback proceeds, since we're not 100% sure we're handling spray tags yet
    }

    if(RELEASED(KEY_FIRE) && iSprayCanTime[playerid] != 0)  // Player has released fire - check if it was more than 2 seconds ago since they pressed it
    {
        if(GetTickCount() - iSprayCanTime[playerid] > 2000)
        {
            OnPlayerSpraySpray(playerid);   // cool, now check to spray any tags
        }
    }
    return 1;
}

// This is called when a player starts to spray his/her spray tag.
OnPlayerSpraySpray(playerid)
{

    // Alright we need to detect if the player is spraying a spray tag..
    for(new i = 0; i < sprayTagGetCount(); i++)
    {
        // Is the spray tag streamed in for the player?
        if(!Streamer_IsItemVisible(playerid, STREAMER_TYPE_OBJECT, sprayTag[i][fSprayObjectID][playerid]))
        {
            continue;
        }

        // Are they in range of a spray tag?
        if(!IsPlayerInRangeOfPoint(playerid, SPRAY_TAG_RANGE, sprayTag[i][fSprayPosX], sprayTag[i][fSprayPosY], sprayTag[i][fSprayPosZ]))
        {
            continue;
        }

        // Okay now the intense stuff D:
        // Just check if they're aiming at the spray tag. If they are wollah
        if(IsPlayerAimingAt(playerid, sprayTag[i][fSprayPosX], sprayTag[i][fSprayPosY], sprayTag[i][fSprayPosZ], SPRAY_TAG_RANGE))
        {
            sprayTagOnPlayerSpray(playerid, i);
            break;
        }
    }
}

// This is called when the player logs in and loads all sprayed tags
sprayTagLoadSprayedTags(playerId) {
    new query[128];
    format(query, sizeof(query), "SELECT tag_id FROM %s WHERE profile_id = %d", SPRAY_TAG_TABLE_NAME, Account(playerId)->userId());
    Database->query(query, "OnSprayTagPlayerDataAvailable", playerId);
}

forward OnSprayTagPlayerDataAvailable(resultId, playerId);
public OnSprayTagPlayerDataAvailable(resultId, playerId) {
    if (DatabaseResult(resultId)->count() > 0) {
        while (DatabaseResult(resultId)->next()) {
            if (sprayTagGetPlayerCount(playerId) >= MAX_SPRAY_TAGS)
                break;

            new tagId = DatabaseResult(resultId)->readInteger("tag_id");
            if (tagId < 0 || tagId >= MAX_SPRAY_TAGS)
                continue;

            ++n_TagsPlayerSprayed[playerId];
            n_PlayerTagsSprayed[playerId][tagId] = true;
        }

        sprayTagUpdateForPlayer(playerId);
    }

    DatabaseResult(resultId)->free();
}

// This function is called when a player types the /inf or /nrg commands,
// which is an unlockable command for players who spray all 100 tags.
sprayTagOnVehicleCommand(playerid, params[], SprayTagVehicle: vehicleType)
{
    #pragma unused params

    if (!Player(playerid)->isAdministrator()) {
        if(!sprayTagHasPlayerSprayedAll(playerid))
        {
            SendClientMessage(playerid, COLOR_RED, "* You have not unlocked this command.");
            return 1;
        }

        // Has the player used /inf in the past 3 minutes?
        if((Time->currentTime() - g_iTimeInfCommandLastUsed[playerid]) < 3 * 60)
        {
            SendClientMessage(playerid, COLOR_RED, "You may only spawn a vehicle once every 3 minutes.");
            return 1;
        }

        if(DamageManager(playerid)->isPlayerFighting() == true)
        {
            SendClientMessage(playerid, COLOR_RED, "* You cannot spawn an a vehicle because you've recently been in a gunfight.");
            return 1;
        }

        if(ShipManager->isPlayerWalkingOnShip(playerid))
        {
            SendClientMessage(playerid, COLOR_RED, "* You cannot spawn vehicles on the ship!");
            return 1;
        }
    }

    if(GetPlayerVirtualWorld(playerid) != 0)
    {
        SendClientMessage(playerid, COLOR_RED, "* You must be in world 0.");
        return 1;
    }

    if(GetPlayerInterior(playerid) != 0)
    {
        SendClientMessage(playerid, COLOR_RED, "* You must be outside to use this command.");
        return 1;
    }

    if(iPlayerInVipRoom[playerid])
    {
        SendClientMessage(playerid, COLOR_RED, "* You must be outside to use this command.");
        return 1;
    }

    // Alright all good. Just some checks first - has the player already spawned a vehicle?
    // Obviously, if so, we need to destroy it.
    if(sprayTagPlayerVehicle[playerid] != Vehicle::InvalidId)
    {
        VehicleManager->destroyVehicle(sprayTagPlayerVehicle[playerid]);
    }

    // Remove them out of any vehicles they may be in.
    if(GetPlayerState(playerid) == PLAYER_STATE_DRIVER)
    {
        SetVehicleToRespawn(GetPlayerVehicleID(playerid));
    }
    else if(GetPlayerState(playerid) == PLAYER_STATE_PASSENGER)
    {
        RemovePlayerFromVehicle(playerid);
    }

    // Set the last time the player used the command
    g_iTimeInfCommandLastUsed[playerid] = Time->currentTime();

    new Float:fPosX, Float:fPosY, Float:fPosZ, Float:fAng; 
    GetPlayerPos(playerid, fPosX, fPosY, fPosZ);
    GetPlayerFacingAngle(playerid, fAng);

    new vehicleModelId = 0;
    switch (vehicleType) {
        case SPRAY_TAG_ELEGY:
            vehicleModelId = 562;
        case SPRAY_TAG_INFERNUS:
            vehicleModelId = 411;
        case SPRAY_TAG_NRG:
            vehicleModelId = 522;
        case SPRAY_TAG_SULTAN:
            vehicleModelId = 560;
        case SPRAY_TAG_TURISMO:
            vehicleModelId = 451;
        case SPRAY_TAG_VORTEX:
            vehicleModelId = 539;
        default:
            return 0;  // invalid vehicle type supplied. nothing we can do really
    }

    // Make the vehicle nice & sexy. Give it nos and stuff and a special number plate.
    sprayTagPlayerVehicle[playerid] = VehicleManager->createVehicle(vehicleModelId, fPosX, fPosY, fPosZ, fAng, -1, -1);
    SetVehicleNumberPlate(sprayTagPlayerVehicle[playerid], PlayerName(playerid));   // custom License Plate, matching the players name

    if (VehicleModel(vehicleModelId)->isNitroInjectionAvailable())
        NitroHandler->enableAndAddInfiniteNos(sprayTagPlayerVehicle[playerid]);  // give the vehicle vehicle Nos

    // Put the player in the newly created vehicle
    PutPlayerInVehicle(playerid, sprayTagPlayerVehicle[playerid], 0); // Now just warp the vehicle to the player.

    Instrumentation->recordActivity(SpawnInfernusActivity);

    GameTextForPlayer(playerid, "~g~VROOM", 5000, 5);
    return 1;
}

// Called from OnVehicleSpawn to check to destroy this bad boy
sprayTagOnVehicleSpawn(vehicleid)
{
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(sprayTagPlayerVehicle[i] == Vehicle::InvalidId)  // psst error checking
        {
            continue;
        }

        if(vehicleid == sprayTagPlayerVehicle[i])   // Alright a players /inf respawned. destroy it!
        {
            VehicleManager->destroyVehicle(vehicleid);
            sprayTagPlayerVehicle[i] = Vehicle::InvalidId;
            break;  // easy.
        }
    }
}
