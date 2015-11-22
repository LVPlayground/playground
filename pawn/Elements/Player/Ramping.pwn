// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/********************************************************************************
*                                                                               *
*  Las Venturas Playground - Ramping Handler                                    *
*                                                                               *
*  Handles ramping stuff upon pressing a key                                    *
*                                                                               *
*  @copyright Copyright (c) 2006-2010 Las Venturas Playground                   *
*  @author    Jay                                                               *
*  @package   Handlers                                                          *
*  @version   $Id: Ramping.pwn 5096 2015-08-10 21:40:33Z cake $                                                              *
*                                                                               *
********************************************************************************/

// Note: there are future plans to rewrite this system.

#define     ENABLE_RAMPING_BY_DEFAULT       1
#define     DEFAULT_RAMP_TYPE               5

new iPlayerRampTime [MAX_PLAYERS];
new DynamicObject: rampid[MAX_PLAYERS] = {DynamicObject: -1, ...};

new ramptypes[] = {
    1503,1660,
    1245,1631,
    1632,1655,
    13593,1696,
    1697,3852,
    5152,8302,
    16357
};

new playerramptypes[MAX_PLAYERS] = {DEFAULT_RAMP_TYPE, ...};
new ramping[MAX_PLAYERS] = {ENABLE_RAMPING_BY_DEFAULT, ...};

// Center of zone for blocking ramps in front of the ship
new Float:fForbiddenRampingZonePositionX = 2034.7362,
    Float:fForbiddenRampingZonePositionY = 1546.3234,
    Float:fForbiddenRampingZonePositionZ =   11.6167;

// Returns 1 if a vehicle is ramping valid, 0 otherwise
stock IsVehicleRampingValid(n_Model)
{
    if(n_Model < 400 || n_Model > 611)
    {
        return 0;
    }

    if (n_Model == 417 || n_Model == 425 ||
        n_Model == 447 || n_Model == 449 ||
        n_Model == 460 || n_Model == 464 ||
        n_Model == 465 || n_Model == 469 ||
        n_Model == 476 || n_Model == 487 ||
        n_Model == 488 || n_Model == 497 ||
        n_Model == 501 || n_Model == 511 ||
        n_Model == 512 || n_Model == 513 ||
        n_Model == 519 || n_Model == 520 ||
        n_Model == 537 || n_Model == 538 ||
        n_Model == 548 || n_Model == 553 ||
        n_Model == 563 || n_Model == 577 ||
        n_Model == 592 || n_Model == 593)
        return 0;

    // We're still here. It's valid!
    return 1;
}



// Called from OnPlayerKeyStateChange
OnPlayerPressRampKey(playerid)
{
    // Is Ramping disabled, globally?
    if ( RampingEnabled == false )
    {
        SendClientMessage(playerid,COLOR_RED, "* Ramping has been temporary disabled by an administrator.");
        return;
    }

    // Is ramping enabled for this player?
    if(!ramping[playerid] || !IsVehicleRampingValid(GetVehicleModel(GetPlayerVehicleID(playerid))))
        return;

    // Obviously the player must be in a vehicle to spawn a ramp.
    if(GetPlayerState(playerid) != PLAYER_STATE_DRIVER)
        return;

    // Is the player in a minigame?
    if(IsPlayerInMinigame(playerid) || PlayerActivity(playerid)->get() != PlayerActivityNone)
        return;

    // Or map zone, too
    if(IsPlayerInMapZone(playerid))
        return;

    new
        Float:fPosX,
        Float:fPosY,
        Float:fPosZ,
        Float:fAngle,
        Float:fDistance;

    GetPlayerPos(playerid, fPosX, fPosY, fPosZ);

    fDistance = GetOptimumRampDistance(playerid);

    fAngle = GetXYInFrontOfPlayer(playerid, fPosX, fPosY, fDistance);

    // We also have to check for anti ramp abuse...

    if(Player(playerid)->isModerator() == false)
    {
        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(!Player(i)->isConnected())
                continue;

            if(IsPlayerNPC(i))
                continue;

            if(!IsPlayerStreamedIn(i, playerid))
                continue;

            if(GetPlayerVirtualWorld(i) != GetPlayerVirtualWorld(playerid))
                continue;

            if(IsPlayerInVehicle(i,GetPlayerVehicleID(playerid)))
                continue;

            if(!IsPlayerInRangeOfPoint(i, 20.0, fPosX, fPosY, fPosZ))
                continue;

            new
                szRampMsg[75];

            format(szRampMsg, 75, "* You cannot spawn a ramp because %s is in the way!", PlayerName(i));
            SendClientMessage(playerid, COLOR_RED, szRampMsg);
            return;
        }
    }

    // Well, let's define a range of blocking ramps in front of the ship
    if(IsPlayerInRangeOfPoint(playerid, 24.5, fForbiddenRampingZonePositionX, fForbiddenRampingZonePositionY,
                              fForbiddenRampingZonePositionZ))
        return;

    // No ramping in the cruise!
    if (CruiseController->isPlayerNearCruiseLeader(playerid) == true) {
        SendClientMessage(playerid, Color::Error, "Error: Ramping is not allowed during a cruise.");
        return;
    }

    switch (playerramptypes[playerid])
    {
        case 1:
        {
            fPosZ -= 0.5;
        }

        case 2:
        {
            fAngle -= 90.0;

            if (fAngle < 0.0)
                fAngle += 360.0;

            fPosZ += 0.5;
        }

        case 12:
        {
            fAngle -= 90.0;

            if (fAngle < 0.0)
                fAngle += 360.0;
        }
    }

    iPlayerRampTime[playerid] = Time->currentTime();

    if(rampid[playerid] != DynamicObject: -1)
    {
        DestroyDynamicObject(rampid[playerid]);
        rampid[playerid] = DynamicObject: -1;
    }

    if (aprilsfools == 1)
    {
        rampid[playerid] = CreateDynamicObject(616, fPosX, fPosY, fPosZ - 0.5, 0.0, 0.0, fAngle, GetPlayerVirtualWorld(playerid));
    }
    else
    {
        if(playerramptypes[playerid] == 12)
        {
            if(Player(playerid)->isAdministrator() == false)
            {
                SendClientMessage(playerid, COLOR_RED, "* You have to be an admin to spawn this ramp! Change your ramp using /my ramp.");
                return;
            }

            GetVehiclePos(GetPlayerVehicleID(playerid), fPosX, fPosY, fPosZ);
            rampid[playerid] = CreateDynamicObject(ramptypes[playerramptypes[playerid]], fPosX, fPosY, fPosZ - 0.5, 0.0, 0.0, fAngle, GetPlayerVirtualWorld(playerid));
        }
        else
        {

            switch(playerramptypes[playerid])           {
                case 2:     rampid[playerid] = CreateDynamicObject(ramptypes[playerramptypes[playerid]], fPosX-1, fPosY, fPosZ - 0.5, 0.0, 0.0, fAngle, GetPlayerVirtualWorld(playerid)); // fixes a bug with it spawning slightly to the left!
                case 6:     rampid[playerid] = CreateDynamicObject(ramptypes[playerramptypes[playerid]],fPosX, fPosY, fPosZ, 0.0, 0.0, fAngle, GetPlayerVirtualWorld(playerid));
                case 7:     rampid[playerid] = CreateDynamicObject(ramptypes[playerramptypes[playerid]],  fPosX, fPosY, fPosZ, 0.0, 0.0, fAngle);
                case 8:     rampid[playerid] = CreateDynamicObject(ramptypes[playerramptypes[playerid]],  fPosX, fPosY, fPosZ - 0.5, 0.0, 0.0, fAngle+180, GetPlayerVirtualWorld(playerid));
                case 9:     rampid[playerid] = CreateDynamicObject(ramptypes[playerramptypes[playerid]],  fPosX, fPosY, fPosZ + 0.7, 0.0, 0.0, fAngle, GetPlayerVirtualWorld(playerid));
                case 10:    rampid[playerid] = CreateDynamicObject(ramptypes[playerramptypes[playerid]],  fPosX, fPosY, fPosZ, 0.0, 0.0, fAngle+90, GetPlayerVirtualWorld(playerid));
                case 11:    rampid[playerid] = CreateDynamicObject(ramptypes[playerramptypes[playerid]],  fPosX, fPosY, fPosZ, 0.0, 0.0, fAngle+15, GetPlayerVirtualWorld(playerid));
                case 12:    rampid[playerid] = CreateDynamicObject(ramptypes[playerramptypes[playerid]],  fPosX, fPosY, fPosZ + 1.4, 0.0, 0.0, fAngle+90, GetPlayerVirtualWorld(playerid));
                default:    rampid[playerid] = CreateDynamicObject(ramptypes[playerramptypes[playerid]], fPosX, fPosY, fPosZ - 0.5, 0.0, 0.0, fAngle, GetPlayerVirtualWorld(playerid));
            }
        }
    }
    Streamer_Update(playerid);
}

forward Float:GetOptimumRampDistance(playerid);
stock Float:GetOptimumRampDistance(playerid)
{
    new ping = GetPlayerPing(playerid), Float:dist;
    dist = floatpower(ping, 0.25);
    dist = dist*4.0;
    dist = dist+5.0;
    return dist;
}

stock RemoveRamp(playerid)
{
    if (rampid[playerid] != DynamicObject: -1)
    {
        DestroyDynamicObject(rampid[playerid]);
        rampid[playerid] = DynamicObject: -1;
        iPlayerRampTime[playerid] = 0;
    }
}

// Called from OnPlayerDisconnect to reset player ramping data
stock ResetPlayerRampingData(playerid)
{
    RemoveRamp(playerid);
    ramping[playerid] = ENABLE_RAMPING_BY_DEFAULT;
    playerramptypes[playerid] = DEFAULT_RAMP_TYPE;
}
