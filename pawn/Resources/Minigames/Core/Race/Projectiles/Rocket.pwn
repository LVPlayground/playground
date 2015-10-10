// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************

    Las Venturas Playground v2.94.0 A2 - Race Rocket v0.1
    This handler allows players to fire so called "rockets" from their race
    vehicle at other players making races that bit more interesting

    The objects associated with this handler are static and do not use
    the Streamer. This is because the streamer lacks functionality
    to attach streamed objects to vehicles.


    Author: James "Jay" Wilkinson
    Lead Developer
    jay@sa-mp.nl


    7th June 2011

    www.sa-mp.nl

  @copyright Copyright (c) 2006-2011 Las Venturas Playground
  @author    
  @package   Race
  @version

********************************************************************************/


#define VEHICLE_MISSILE_OBJECT_ID   3790        // Object ID to attach to the side of the vehicle
#define VEHICLE_MISSILE_SMOKE_ID    18726       // Smoke particle ID
#define VEHICLE_MISSILE_FLARE_ID    345         // The id of the object when its been fired

#define VEHICLE_MISSILE_SPEED       70.0        // Speed the missiles travel at
#define MAX_VEHICLE_MISSILES        20          // Maximum amount of missiles (ammo) a vehicle can hold

#define MISSILE_Z_OFFSET            11.5          // Offset according to the target textdraw
#define MISSILE_TRAVEL_DISTANCE     140.0         // Distance the missile travels before exploding (will be dynamic soon)

#define VEHICLE_EXPLOSION_TYPE      10
#define VEHICLE_EXPLOSION_RADIUS    10.0

#define SMOKE_OBJECTS               10           // How many smoke particle objects get created? For special affects

enum E_VEHICLE_MISSILE
{
    eMissileObjectID[MAX_VEHICLE_MISSILES],
    eMissileObjectVehicle[MAX_VEHICLE_MISSILES],
//  eSmokeID[MAX_VEHICLE_MISSILES], // UPDATE: Made this dynmaic so its easy to change the amount of smoke that shows for changing affects
    eMissileCount
}

static  eRaceVehicleMissile[MAX_VEHICLES][E_VEHICLE_MISSILE];

static  eSmokeID[MAX_VEHICLES][SMOKE_OBJECTS][MAX_VEHICLE_MISSILES]; // see above enum

static  Text:iRaceRocketText = Text:INVALID_TEXT_DRAW;

// Create the race rocket textdraw
InitializeRaceRocket()
{
    iRaceRocketText = TextDrawCreate(306.000000, 174.000000, "+");
    TextDrawBackgroundColor(iRaceRocketText, 16711935);
    TextDrawFont(iRaceRocketText, 2);
    TextDrawLetterSize(iRaceRocketText, 0.610000, 2.200001);
    TextDrawColor(iRaceRocketText, -16776961);
    TextDrawSetOutline(iRaceRocketText, 0);
    TextDrawSetProportional(iRaceRocketText, 1);
    TextDrawSetShadow(iRaceRocketText, 1);
}

// Add our missile to the vehicle
stock AddVehicleMissile(vehicleid/*, Float:fXOffset = -1.1, Float:fZOffset = 0.2*/)
{
    if(vehicleid < 0 || vehicleid > MAX_VEHICLES)
    {
//      printf("[Race] Unable to add vehicle missile to vehicle %d (invalid vehicle id)", vehicleid);
        return 0;
    }

    new iMissileCount = GetVehicleMissileAmmo(vehicleid);

    if(iMissileCount >= MAX_VEHICLE_MISSILES)
    {
     //   printf("[Race] Warning: Unable to add vehicle missile to vehicle %d: (Vehicle missile limits breached)", vehicleid);
        return 0;
    }

    new
        Float:fPosX,
        Float:fPosY,
        Float:fPosZ,
        Float:fXOffset,
        Float:fZOffset;

    GetVehiclePos(vehicleid, fPosX, fPosY, fPosZ);

    // Calculate which side to add the missile onto the vehicle

    if( (eRaceVehicleMissile[vehicleid][eMissileCount]) &1)
    {
        fXOffset = -1.1;
        fZOffset = 0.2;
    }
    else
    {
        fXOffset = 1.1;
        fZOffset = 0.2;
    }

    // Increase the number of ammo for the GetVehicleMissileAmmo function
    eRaceVehicleMissile[vehicleid][eMissileCount]++;

    // Check if the missile or side rocket objects exists. They shouldn't, but just in case.
    if(IsValidObject( eRaceVehicleMissile[vehicleid][eMissileObjectID][iMissileCount] ) || IsValidObject( eRaceVehicleMissile[vehicleid][eMissileObjectVehicle][iMissileCount] ))
    {
        DestroyObject(eRaceVehicleMissile[vehicleid][eMissileObjectID][iMissileCount]);
        DestroyObject(eRaceVehicleMissile[vehicleid][eMissileObjectVehicle][iMissileCount]);

        eRaceVehicleMissile[vehicleid][eMissileObjectID][iMissileCount]         =   INVALID_OBJECT_ID;
        eRaceVehicleMissile[vehicleid][eMissileObjectVehicle][iMissileCount]    =   INVALID_OBJECT_ID;
    }

    // Create the physical vehicle rocket object and attach it to the vehicle.
    eRaceVehicleMissile[vehicleid][eMissileObjectVehicle][iMissileCount] = CreateObject(VEHICLE_MISSILE_OBJECT_ID, fPosX, fPosY, fPosZ, 0, 0, 0);
    AttachObjectToVehicle(eRaceVehicleMissile[vehicleid][eMissileObjectVehicle][iMissileCount], vehicleid, fXOffset, 0, fZOffset, 0, 0, 270);

    // Show the textdraw for all players in the vehicle
    // which displays the target
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(!Player(i)->isConnected() || IsPlayerNPC(i))
        {
            continue;
        }

        if(GetPlayerState(i) != PLAYER_STATE_DRIVER)
        {
            continue;
        }

        if(!IsPlayerInVehicle(i, vehicleid))
        {
            continue;
        }

        TextDrawShowForPlayer(i, iRaceRocketText);
    }
    return 1;
}


// Fire a missile from a vehicle at the stated co-ords
stock FireMissileVehicle(vehicleid, Float:fDestX, Float:fDestY, Float:fDestZ)
{
    // Is there any ammo in the vehicle
    if(GetVehicleMissileAmmo(vehicleid) <= 0)
    {
    //  printf("[Race] FireMissileVehicle failed: No ammo found on vehicle %d.", vehicleid);
        return 0;
    }

    // Alright find a missile to fire
    // Nice and dynamic so more than one can be fired at a time.
    new iMissileID = -1;

    for(new i = 0; i < MAX_VEHICLE_MISSILES; i++)
    {
        if(IsValidObject( eRaceVehicleMissile[vehicleid][eMissileObjectVehicle][i] ))
        {
            // Cool we found a missile to fire \o
    //      printf("[Race] Found object %d race rocket (index: %d)", eRaceVehicleMissile[vehicleid][eMissileObjectVehicle][i], i);
            iMissileID = i;
            break;
        }
    }

    // Couldn't find a missile to fire :X (should be an impossible scenario, but just in case.)
    if(iMissileID == -1)
    {
    //  printf("[Race] Warning: Unable to fire race rocket: No rockets found on vehicle %d.", vehicleid);
        return 0;
    }

    // Now to fire our missile (i.e. to move it towards the target)

    // First thing is to remove the physical object off the vehicle
    DestroyObject(eRaceVehicleMissile[vehicleid][eMissileObjectVehicle][iMissileID]);
    eRaceVehicleMissile[vehicleid][eMissileObjectVehicle][iMissileID] = INVALID_OBJECT_ID;

    // Now get the vehicle location data and create the missile flare at the vehicles location.
    new
        Float:fPosX,
        Float:fPosY,
        Float:fPosZ;

    GetVehiclePos(vehicleid, fPosX, fPosY, fPosZ);

    // Quickly check to see if the specified missile object already exists. It shouldn't, but just in case!
    if(IsValidObject(eRaceVehicleMissile[vehicleid][eMissileObjectID][iMissileID]))
    {
        DestroyObject(eRaceVehicleMissile[vehicleid][eMissileObjectID][iMissileID]);
        eRaceVehicleMissile[vehicleid][eMissileObjectID][iMissileID] = INVALID_OBJECT_ID;
    }

    // Create the object at the vehicles position. It will then instantly move towards the target
    eRaceVehicleMissile[vehicleid][eMissileObjectID][iMissileID] = CreateObject(VEHICLE_MISSILE_FLARE_ID, fPosX, fPosY, fPosZ, 0, 0, 0);

    // Now create the smoke affect
    // Bit of error checking to see if any smoke objects associated with this particular
    // missile already exists. Shouldn't do, but just check in caxse.
    for(new i = 0; i < SMOKE_OBJECTS; i++)
    {
        if(IsValidObject(eSmokeID[vehicleid][i][iMissileID]))
        {
            DestroyObject(eSmokeID[vehicleid][i][iMissileID]);
        }

        // Now Create the smoke
        eSmokeID[vehicleid][i][iMissileID] = CreateObject(VEHICLE_MISSILE_SMOKE_ID, fPosX+random(2), fPosY, fPosZ, 0, 0, 0, 300);

        // and move it towards the target, slightly slower than the missile, so it's slightly behind it
        MoveObject(eSmokeID[vehicleid][i][iMissileID], fDestX, fDestY, fDestZ, VEHICLE_MISSILE_SPEED - 10*i);
    }


    // Move the missile towards the target, too
    MoveObject(eRaceVehicleMissile[vehicleid][eMissileObjectID][iMissileID], fDestX, fDestY, fDestZ, VEHICLE_MISSILE_SPEED);

    // decrease the ammo
    eRaceVehicleMissile[vehicleid][eMissileCount]--;

    // Check to hide the target textdraw if there's no ammo left
    if(GetVehicleMissileAmmo(vehicleid) <= 0)
    {
        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if(!Player(i)->isConnected() || IsPlayerNPC(i))
            {
                continue;
            }

            if(GetPlayerState(i) != PLAYER_STATE_DRIVER)
            {
                continue;
            }

            if(!IsPlayerInVehicle(i, vehicleid))
            {
                continue;
            }

            TextDrawHideForPlayer(i, iRaceRocketText);
        }
    }
    // Done. Let the object movement callback handle the explosion when it eventually reaches the target
    return 1;
}

// Called from OnPlayerStateChange to check when
// a player leaves a vehicle which is armed with a missile, we
// may need to hide the target textdraw, or show it.
MissileCheckStateChange(playerid, oldstate, newstate, vehicleid)
{
    // If the vehicle in question has no missiles we don't need to proceed in any event.
    if(GetVehicleMissileAmmo(vehicleid) <= 0)
    {
        return 0;
    }

    // Player has left a vehicle so we must hide the target
    if(oldstate == PLAYER_STATE_DRIVER)
    {
        TextDrawHideForPlayer(playerid, iRaceRocketText);
    }

    // They've entered a vehicle with missiles. show the target
    if(newstate == PLAYER_STATE_DRIVER)
    {
        TextDrawShowForPlayer(playerid, iRaceRocketText);
    }
    return 1;
}

// This function is called from OnObjectMoved to check if it's
// a vehicle missile object that's finished moving. If so it creates
// an explosion affect and destroys all corresponding smoke particles and missile flare objects
CheckVehicleMissileExplode(objectid)
{
    // Gunna be heavy. Might need to think of a way of avoiding the vehicle loop
    // By storing the vehicle ID somewhere111oneone
    for(new i = 0; i < MAX_VEHICLE_MISSILES; i++)
    {
        // GULP. Hope Peter doesn't see this :X
        for(new vehicleid = 0; vehicleid < MAX_VEHICLES; vehicleid++)
        {
            // Alright we've got a match. Someones missile has finished moving towards
            // the target. Get rid of all associated objects, particles, etc, reset all relevant
            // data and, of course, create an explosion
            if(objectid == eRaceVehicleMissile[vehicleid][eMissileObjectID][i])
            {
                new
                    Float:fPosX,
                    Float:fPosY,
                    Float:fPosZ;

                GetObjectPos(objectid, fPosX, fPosY, fPosZ);

                // Destroy the missile
                DestroyObject(eRaceVehicleMissile[vehicleid][eMissileObjectID][i]);
                eRaceVehicleMissile[vehicleid][eMissileObjectID][i] = INVALID_OBJECT_ID;

                // Destroy the smoke
                for(new j = 0; j < SMOKE_OBJECTS; j++)
                {
                    DestroyObject(eSmokeID[vehicleid][j][i]);
                    eSmokeID[vehicleid][j][i] = INVALID_OBJECT_ID;
                }

                // Create the explosion and we're done
                CreateExplosion(fPosX, fPosY, fPosZ, VEHICLE_EXPLOSION_TYPE, VEHICLE_EXPLOSION_RADIUS);

                return 1;
            }
        }
    }
    return 0;
}

// This function is called from OnPlayerKeyStateChange
// when a player presses CTL in a vehicle to check to fire the rocket.
CheckVehicleMissileFire(playerid, vehicleid)
{
    new
        Float:fPX, Float:fPY, Float:fPZ,
        Float:fVX, Float:fVY, Float:fVZ,
        Float:object_x, Float:object_y, Float:object_z;

    //  A larger scale increases the distance from the camera.
    // A negative scale will inverse the vectors and make them face in the opposite direction.
    const
        Float:fScale = MISSILE_TRAVEL_DISTANCE;

    GetPlayerCameraPos(playerid, fPX, fPY, fPZ);
    GetPlayerCameraFrontVector(playerid, fVX, fVY, fVZ);

    object_x = fPX + floatmul(fVX, fScale);
    object_y = fPY + floatmul(fVY, fScale);
    object_z = fPZ + floatmul(fVZ, fScale);

    // Done. Fire the missile \o
    FireMissileVehicle(vehicleid, object_x, object_y, object_z + MISSILE_Z_OFFSET);
}

// Return the vehicles missile ammo
GetVehicleMissileAmmo(vehicleid)
{
    if(vehicleid < 0 || vehicleid > MAX_VEHICLES)
    {
        return 0;
    }
    return eRaceVehicleMissile[vehicleid][eMissileCount];
}
