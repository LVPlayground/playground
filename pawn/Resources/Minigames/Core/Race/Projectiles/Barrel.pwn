// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************

    Las Venturas Playground v2.94.0 A2 - Race Barrel v0.1

    Similar to the race projectile: Rockets, this handler will drop a barrel
    out the back of a players vehicle onto the ground. Obviously, if a player
    impacts with a barrel it will explode. Barrels will be limited for players,
    so they can only drop x amount at a time so the race course doesn't end up
    full of barrels


    Author: James "Jay" Wilkinson
    Lead Developer
    jay@sa-mp.nl


    22nd June 2011

    www.sa-mp.nl

  @copyright 
  @author    
  @package   
  @version

********************************************************************************/


#define     BARREL_OBJECT_ID                1225
#define     BARREL_OBJECT_DRAW_DISTANCE     300.0       // Adjust the physical draw distance of the object. Preferably should be nice and high!


#define     MAX_BARRELS_PER_VEHICLE      4           // How many can a player drop, max? (It'll delete the first one if the player drops another and so on)

#define     BARREL_SPAWN_RANGE_OFFSET   5.0         // How many meters should the barrel spawn behind the vehicle



enum    E_VEHICLE_BARREL
{
    eBarrelsDropped,                // Stores the total number of barrels dropped by a vehicles
    eBarrelsTempDropped,            // Stores the current number of active barrels by a vehicle (resets after eBarrelsDroped = MAX_BARRELS_PER_VEHICLE)
    eBarrelAmmo,
    eBarrelObjectID[MAX_BARRELS_PER_VEHICLE]
}

static  eRaceVehicleBarrel[MAX_VEHICLES][E_VEHICLE_BARREL];

// This function adds a barrel to the specified vehicleid
stock AddVehicleBarrel(vehicleid)
{
    if(vehicleid < 0 || vehicleid > MAX_VEHICLES)
    {
        return 0;
    }

    // k just increase the vehicle ammo
    eRaceVehicleBarrel[vehicleid][eBarrelAmmo]++;
    return 1;
}

// This function drops a barrel behind the vehicle
stock DropVehicleBarrel(vehicleid)
{
    // Has the vehicle got any barrels left?!
    if(GetVehicleBarrelAmmo(vehicleid) <= 0)
    {
//      printf("[Vehicle Barrels] Unable to drop barrel for vehicle %d (No ammo!)", vehicleid);
        return 0;
    }

    new
        Float:fPosX,
        Float:fPosY,
        Float:fPosZ;

    // Get the Z Height for now
    GetVehiclePos(vehicleid, fPosX, fPosY, fPosZ);

    // Alright now find an object slot to use
    new iObjectIndex = 0;

    if(GetVehicleBarrelsDropped(vehicleid) >= MAX_BARRELS_PER_VEHICLE)
    {
        // Ok, the player has dropped the maximum amount of barrels to be shown at a time.
        // We therefore need to calculate the oldest barrel they dropped, which we use a temp var for.

        // Kay, temp var is at its max, reset it so we can start again from the beginning.
        if(eRaceVehicleBarrel[vehicleid][eBarrelsTempDropped] >= MAX_BARRELS_PER_VEHICLE)
        {
            eRaceVehicleBarrel[vehicleid][eBarrelsTempDropped] = 0;
        }

        iObjectIndex = eRaceVehicleBarrel[vehicleid][eBarrelsTempDropped];
        eRaceVehicleBarrel[vehicleid][eBarrelsTempDropped]++;
    }
    else
    {
        iObjectIndex = GetVehicleBarrelsDropped(vehicleid);
    }

    // K now drop the actual object
    // Just check in case it exists already first (who knows!)

    if(IsValidDynamicObject(eRaceVehicleBarrel[vehicleid][eBarrelObjectID][iObjectIndex]))
    {
        DestroyDynamicObject(eRaceVehicleBarrel[vehicleid][eBarrelObjectID][iObjectIndex]);
    }

    eRaceVehicleBarrel[vehicleid][eBarrelObjectID][iObjectIndex] = CreateDynamicObject(BARREL_OBJECT_ID, fPosX, fPosY, fPosZ, 0, 0, 0, GetVehicleVirtualWorld(vehicleid), -1, -1);
    Streamer_SetFloatData(STREAMER_TYPE_OBJECT, eRaceVehicleBarrel[vehicleid][eBarrelObjectID][iObjectIndex], E_STREAMER_DRAW_DISTANCE, BARREL_OBJECT_DRAW_DISTANCE);

    // Increase the number of dropped barrels for the player
    eRaceVehicleBarrel[vehicleid][eBarrelsDropped]++;

    // Decrease the ammo and we're done. easy peazy lemon squeezy
    eRaceVehicleBarrel[vehicleid][eBarrelAmmo] --;
    return 1;
}

// Return the amount of barrels contained within this vehicle
stock GetVehicleBarrelAmmo(vehicleid)
{
    if(vehicleid < 0 || vehicleid > MAX_VEHICLES)
    {
        return 0;
    }

    return eRaceVehicleBarrel[vehicleid][eBarrelAmmo];
}

// Return the amount of barrels currently droped by this vehicle
stock GetVehicleBarrelsDropped(vehicleid)
{
    if(vehicleid < 0 || vehicleid > MAX_VEHICLES)
    {
        return 0;
    }
    return eRaceVehicleBarrel[vehicleid][eBarrelsDropped];
}

// This is called from OnVehicleRespawn to check
// to remove any barrels and reset any data associated with this vehicle.
OnBarrelVehicleRespawn(vehicleid)
{
    ResetVehicleBarrelData(vehicleid);
    return 1;
}

// We may have to reset all the barrel data if the vehicle respawns etc
// and obviously, delete all associated barrels with the vehicle.
stock ResetVehicleBarrelData(vehicleid)
{
    for(new i = 0; i < MAX_BARRELS_PER_VEHICLE; i++)
    {
        if(IsValidDynamicObject(eRaceVehicleBarrel[vehicleid][eBarrelObjectID][i]))
        {
            DestroyDynamicObject(eRaceVehicleBarrel[vehicleid][eBarrelObjectID][i]);
            eRaceVehicleBarrel[vehicleid][eBarrelObjectID][i] = INVALID_OBJECT_ID;
        }
    }

    // Just reset the ammo and the amount of barrels the player currently has dropped and we're done \o
    eRaceVehicleBarrel[vehicleid][eBarrelAmmo] = 0;
    eRaceVehicleBarrel[vehicleid][eBarrelsDropped] = 0;
}

