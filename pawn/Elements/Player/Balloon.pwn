// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*
    Las Venturas Playground v2.94 Alpha 4
    SA-MP 0.3d RC7 adds a new Hot Air Balloon object to the game.
    Using this, this file creates a hot air balloon on LVP above the ship
    and periodically moves it very slowly in random directions around the area.

    Author: James "Jay" Wilkinson
    29th October 2011

    Copyright(c) Las Venturas Playground Development team

    Contact Details:
    sa-mp.nl
    jay@sa-mp.nl
    dev@sa-mp.nl
*/

#define     HOT_AIR_BALLOON_OBJECT                      19332         // Object ID for the hot air balloon
#define     HOT_AIR_BALLOON_MIN_Z                       55          // Minimum Z height which the balloon can be at any time
#define     MAX_HOT_AIR_BALLOON_DISTANCE_FROM_SPAWN     120         // Maximum distance from the default spawn point the balloon can travel
#define     MAX_HOT_AIR_BALLOON_SPEED                   3           // Max speed the balloon can travel

static      DynamicObject: iHotAirBalloonObjectID = DynamicObject: INVALID_OBJECT_ID;

// Spawn co-ords for the Balloon
// If you no longer wish the balloon to be above the ship change these co-ords.
static      Float:fHotAirBalloonSpawn[3] = {2046.49, 1550.25, 62.67};

// Create (or re-create) the hot air balloon object.
// Called when the gamemode initializes
InitHotAirBalloon()
{
    // Check if one already exists and destroy it if so
    if(iHotAirBalloonObjectID != DynamicObject: INVALID_OBJECT_ID)
    {
        DestroyDynamicObject(iHotAirBalloonObjectID);
    }

    iHotAirBalloonObjectID = CreateDynamicObject(19332, fHotAirBalloonSpawn[0], fHotAirBalloonSpawn[1], fHotAirBalloonSpawn[2], 0.00, 0.00, 0.00);
    MoveHotAirBalloon();
}

// Move the hot air balloon every so often
// to a new destination within the spawns radius at a random but slow speed
MoveHotAirBalloon()
{
    // Error checking - if the balloon has somehow been destroyed re-create it
    if(!IsValidDynamicObject(iHotAirBalloonObjectID))
    {
        InitHotAirBalloon();
        return;
    }

    // If the hot air balloon is more than the allowed distance it can be from the spawn,
    // we need to move it back
    if(GetHotAirBalloonDistanceFromSpawn() >= MAX_HOT_AIR_BALLOON_DISTANCE_FROM_SPAWN)
    {
        MoveDynamicObject(iHotAirBalloonObjectID, fHotAirBalloonSpawn[0] - random(5), fHotAirBalloonSpawn[1] - random(5), fHotAirBalloonSpawn[2], 0.1);
    }
    else
    {

        // Calculate a position to move the baloon to within
        // the spawn area.
        new
            Float:MoveX,
            Float:MoveY,
            Float:MoveZ,
            Float:MoveSpeed;

        if(random(2) == 1)
        {
            MoveX = fHotAirBalloonSpawn[0] + random( floatround( MAX_HOT_AIR_BALLOON_DISTANCE_FROM_SPAWN / 3));
            MoveY = fHotAirBalloonSpawn[1] - random( floatround( MAX_HOT_AIR_BALLOON_DISTANCE_FROM_SPAWN / 3));
            MoveZ = fHotAirBalloonSpawn[2] - random( floatround( fHotAirBalloonSpawn[2] - HOT_AIR_BALLOON_MIN_Z));
        }
        else
        {
            MoveX = fHotAirBalloonSpawn[0] - random( floatround( MAX_HOT_AIR_BALLOON_DISTANCE_FROM_SPAWN / 3));
            MoveY = fHotAirBalloonSpawn[1] + random( floatround( MAX_HOT_AIR_BALLOON_DISTANCE_FROM_SPAWN / 3));
            MoveZ = fHotAirBalloonSpawn[2] + random( floatround( fHotAirBalloonSpawn[2] - HOT_AIR_BALLOON_MIN_Z));
        }

        MoveSpeed = random(MAX_HOT_AIR_BALLOON_SPEED);

        // Make sure it's not 0
        if(!MoveSpeed)
        {
            MoveSpeed = 0.5;
        }

        // Move the balloon to a random position in the ship area
        MoveDynamicObject(iHotAirBalloonObjectID, MoveX, MoveY, MoveZ, MoveSpeed);
    }
}

// When the balloon is idle, this function "glides" it through the wind
// by moving it incredibly slowly to a new random destination very close to the current one
GlideHotAirBalloon()
{
    if(!IsValidDynamicObject(iHotAirBalloonObjectID))
    {
        InitHotAirBalloon();
        return;
    }

    new
        Float:fPosX,
        Float:fPosY,
        Float:fPosZ;

    GetDynamicObjectPos(iHotAirBalloonObjectID, fPosX, fPosY, fPosZ);
    MoveDynamicObject(iHotAirBalloonObjectID, fPosX + random(5), fPosY + random(10), fPosZ - random(5), 0.2);
}

// This function is wrapped from OnObjectMoved
// and checks to see if it's the hot air balloon object ID that's finished moving.
CheckHotAirBalloonMovement(DynamicObject: objectid)
{
    if(objectid == iHotAirBalloonObjectID)
    {
        if(random(3) == 1)
        {
            MoveHotAirBalloon();
        }
        else
        {
            GlideHotAirBalloon();
        }
        return 1;
    }
    return 0;
}


// Return the current distance of the Hot Air Balloon object
// from the spawn
GetHotAirBalloonDistanceFromSpawn()
{
    new
        Float:fPosX,
        Float:fPosY,
        Float:fPosZ;

    GetDynamicObjectPos(iHotAirBalloonObjectID, fPosX, fPosY, fPosZ);
    return floatround(floatsqroot(((fPosX - fHotAirBalloonSpawn[0]) * (fPosX - fHotAirBalloonSpawn[1])) + ((fPosY - fHotAirBalloonSpawn[1]) * (fPosY - fHotAirBalloonSpawn[1])) + ((fPosZ - fHotAirBalloonSpawn[2]) * (fPosZ - fHotAirBalloonSpawn[2]))));
}


