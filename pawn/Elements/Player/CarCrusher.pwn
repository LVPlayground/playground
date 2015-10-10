// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
*               Las Venturas Playground v2.90 - Car crusher                    *
*   This is a system which offers just another money earning method to LVP.    *
*   Players can drive there vehicle to there local scrap yard and get it       *
*   crushed for a specific crap value - Depending on how many modifcations the *
*   vehicle has, and the condition it is in. Each vehicle is worth different   *
*   amounts of money, such as a Banshee being worth a lot because of it's      *
*   performance, and a Sentinel being reasonable.                              *
*                                                                              *
*   Date: 24/12/2008 -  Christmas Eve! =)                                      *
*   Author: James Wilkinson - Lead 2.x developer                               *
*   wilkinson_929@hotmail.com                                                  *
*******************************************************************************/

static CCrush__Modifications[MAX_VEHICLES]; // How many mods has a vehicle had?
static iCrushVehicle[MAX_PLAYERS];                // What vehicle is the player driving?
static iLastCrush[MAX_PLAYERS];                   // Stores the ID of the last vehicle crushed, to prevent any abuse!


// CCrush__Modify
// This function get's called when a vehicle adds a modifcation
// to calculate an accurate vehicle value.
CCrush__Modify(vehicleid)
{
    CCrush__Modifications[vehicleid]++;
}

// CCrush__Reset
// This function resets everything which makes the vehicle
// value dependant, such as the amount of modifcation it has had.
// useful for when the vehicle respawns or gets crushed.
CCrush__Reset(vehicleid)
{
    CCrush__Modifications[vehicleid] = false;
}

// CCrush__StateChange
// This function is called from OnPlayerStateChange and
// handles the car crusher
CCrush__StateChange(playerid,newstate,oldstate)
{
    // When a player enters a vehicle, we store the vehicle ID
    // so we can determine it later when they leave the car.
    if(newstate == PLAYER_STATE_DRIVER)
    iCrushVehicle[playerid] = GetPlayerVehicleID(playerid);

    // Now, when a player gets out of a car, we manage the process
    // of checking if the player is in the crush area.
    if(newstate == PLAYER_STATE_ONFOOT && oldstate == PLAYER_STATE_DRIVER)
    {
        if(CCrush__InArea(playerid))
        {
            // Is the vehicle a valid crush-able vehicle?
            if(CCrush__CalcValue(iCrushVehicle[playerid]) == -1)
            {
                ShowBoxForPlayer(playerid, "Hey! I'm not crushing anything like that - Get outta here!");
                return 1;
            }

            // Right, if a player tries to crush the same vehicle ID as the
            // last vehicle they crushed, likelyhood is, they are trying to
            // abuse a nearby parked vehicle, so, we don't allow it :)
            if(iCrushVehicle[playerid] == iLastCrush[playerid])
            {
                ShowBoxForPlayer(playerid, "I'm not crushing that right now - Get that outta 'ere!");
                return 1;
            }

            new iValue = CCrush__CalcValue(iCrushVehicle[playerid]);
            GameTextForPlayer(playerid,"Vehicle crushed!",3000,6);
            new iStr[128];
            format(iStr,128,"Your %s has been crushed! Scrap Value: $%s.",
            VehicleModel(GetVehicleModel(iCrushVehicle[playerid]))->nameString(), formatPrice(iValue));
            ShowBoxForPlayer(playerid, iStr);

            GivePlayerMoney(playerid,iValue);

            SetVehicleToRespawn(iCrushVehicle[playerid]);

            iLastCrush[playerid] = iCrushVehicle[playerid];
        }

    }

    return 1;
}

// CCrush__CalcValue
// This function calculates the value of a
// vehicle and returns it. If the vehicle is
// an invalid crush-type, it will return-1n invalid ID.
CCrush__CalcValue(vehicleid)
{
  /*  if(!GetVehicleModel(vehicleid)) return -1;
    if(GetVehicleGroup(vehicleid) == -1) return -1;

    new iVehicleValue;

    switch(GetVehicleGroup(vehicleid))
    {
        case SPORTS:        iVehicleValue = 11000;
        case BIKES:         return -1;
        case LOWRIDER:      iVehicleValue = 7000;
        case OFFROAD:       iVehicleValue = 8000;
        case SALOONS:       iVehicleValue = 6000;
        case CONVERTIBLES:  iVehicleValue = 8000;
        default:            iVehicleValue = random(2000) + 4000;
    }

    new Float:iHealth = GetVehicleHealth(vehicleid,iHealth);
    iVehicleValue = iVehicleValue + floatround(iHealth) + 2500;
    iVehicleValue = iVehicleValue + CCrush__Modifications[vehicleid]*500;
    iVehicleValue = randomex(iVehicleValue,iVehicleValue+CCrush__Modifications[vehicleid]+500);
    return iVehicleValue;*/
    #pragma unused vehicleid
    return 4000;
}

// CCrush__InArea
// This function returns true if a player
// is in the car crusher area, and 0 if a player isn't.
CCrush__InArea(playerid)
{
    if(!Player(playerid)->isConnected())
    return 0;
    if(GetPlayerVirtualWorld(playerid) != 0)
    return 0;
    if(IsPlayerInMinigame(playerid))
    return 0;

    new
        Float:x,
        Float:y,
        Float:z;
    GetPlayerPos(playerid,x,y,z);

    if(z > 20)
        return 0;

    if(isPlayerInAreaEx(playerid,1063.2418,1072.4828,1767.1273,1785.6494))
        return 1;

    return 0;
}

// CCrush__Connect
// This is called from OnPlayerConnect
// and resets the vars for the car crusher.
CCrush__Connect(playerid)
{
    iLastCrush[playerid] = -1;
}
