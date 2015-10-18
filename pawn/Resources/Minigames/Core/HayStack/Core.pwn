// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************


    Las Venturas Playground v2.94.0 Alpha

    This file handles the core of the haystack for the haystack minigame.

    It handles hayment creation and destroyal together with smooth
    movement of each haystack.


    Author: R@F, jay

    @copyright (c) Las Venturas Playground 2011
    @package core handlers
    @author: Jay
    @version



********************************************************************************/

#define     HAY_STATE_IDLE          0
#define     HAY_STATE_SIGNUP        1
#define     HAY_STATE_OBJECTIVE     2
#define     HAY_STATE_RUNNING       3

// some defines to determine our basic settings & configuration
#define HAY_LENGTH_X            4
#define HAY_WIDTH_Y             4
#define HAY_HEIGHT_Z            30
#define HAY_OBJECT_COUNT        146
#define HAY_ROCKS               4
#define SPEED_FACTOR            3000.0
#define HAY_OBJECT              3374
#define ROCK_OBJECT             1305
#define HAY_WORLD               -1      // All worlds yey \o

// Vars used within the class
static CalcChange[4];
static Hay_Matrix[HAY_LENGTH_X][HAY_WIDTH_Y][HAY_HEIGHT_Z];
static DynamicObject: g_Hay_Object[2][HAY_OBJECT_COUNT];
static DynamicObject: Hay_Offset;
static Random_Hay_Calc[HAY_OBJECT_COUNT];

static  Hay_Timer;

// Timer used to determine when the object ends. Temp, Will use OnObjectMoved soon
forward ProcessObject(Hayid, Hay_x, Hay_y, Hay_z);


// CHay__Initialize
// This function intializes the haystack and lays it out,
// destroying the previous hay stack first. It can be quite
// useful incase some hay stacks break with rocks.
CHay__Initialize()
{

    new x, y, z;

    CalcChange[0] = 2000 / (HAY_HEIGHT_Z+ 1);
    CalcChange[1] = 1500 / (HAY_HEIGHT_Z+ 1);


    // Reset the data first of all, obviously.
    for(x = 0; x < HAY_LENGTH_X; x++)
    {
        for(y = 0; y <HAY_WIDTH_Y; y++)
        {
            for(z = 0; z < HAY_HEIGHT_Z; z++)
            {
                Hay_Matrix[x][y][z] = 0;
            }
        }
    }

    for(new iHayObjectID = 0; iHayObjectID < HAY_OBJECT_COUNT; iHayObjectID++)
    {
        do
        {
            x = random (HAY_LENGTH_X);
            y = random (HAY_WIDTH_Y);
            z = random (HAY_HEIGHT_Z);
        }
        while (Hay_Matrix[x][y][z] != 0);

        Hay_Matrix[x][y][z] = 1;
        g_Hay_Object[0][iHayObjectID] = CreateDynamicObject(HAY_OBJECT, x*(-4), y*(-4), (z+1)*3, 0.0, 0.0, random (2)*180, HAY_WORLD);
    }

    for(new iHayRockID = 0; iHayRockID < HAY_ROCKS; iHayRockID++)
    {
        do
        {
            x = random (HAY_LENGTH_X);
            y = random (HAY_WIDTH_Y);
            z = random (HAY_HEIGHT_Z);
        }
        while (Hay_Matrix[x][y][z] != 0);

        Hay_Matrix[x][y][z] = 1;
        g_Hay_Object[1][iHayRockID] = CreateDynamicObject(ROCK_OBJECT, x*-4, y*-4, (z+1)*3, random (360), random (360), random (360), HAY_WORLD);
    }

    CalcChange[2] = (HAY_LENGTH_X + 1) * -2;
    CalcChange[3] = (HAY_WIDTH_Y + 1) * -2;
    Hay_Offset = CreateDynamicObject(HAY_OBJECT, CalcChange[2], CalcChange[3], HAY_HEIGHT_Z*3 + 3, 0, 0, 0, HAY_WORLD);

}





// CHay__Destroy
// This function destroys the haystack. Simple
CHay__Destroy()
{

    // Destroy the actual hay pieces
    for (new i=0 ; i<HAY_OBJECT_COUNT ; i++)
    {
        if(!IsValidDynamicObject(g_Hay_Object[0][i]))
        {
            continue;
        }

        DestroyDynamicObject(g_Hay_Object[0][i]);
        g_Hay_Object[0][i] = DynamicObject: INVALID_OBJECT_ID;
    }


    // Don't forget that one offset!
    if(IsValidDynamicObject(Hay_Offset))
    {
        DestroyDynamicObject(Hay_Offset);
        Hay_Offset = DynamicObject: INVALID_OBJECT_ID;
    }


    // Destroy the rocks associated with the Haystack
    for (new i=0 ; i<HAY_ROCKS; i++)
    {
        if(!IsValidDynamicObject(g_Hay_Object[1][i]))
        {
            continue;
        }

        DestroyDynamicObject(g_Hay_Object[1][i]);
        g_Hay_Object[1][i] = DynamicObject: INVALID_OBJECT_ID;
    }

    KillTimer(Hay_Timer);
    Hay_Timer = -1;
}


// CHay__Process
// This function is called from LVP's fast timers. It
// manages the process of moving the hay.

CHay__Process()
{
    if (hayGetState() != HAY_STATE_RUNNING)
        return;

    new
        rand,
        DynamicObject: g_RandomHay,
        g_HayMovement,
        x, y, z,
        Float:x2,
        Float:y2,
        Float:z2,
        Temps,
        Float:Hay_Speed;


    do
    {
        rand = random (HAY_OBJECT_COUNT);
    }
    while (Random_Hay_Calc[rand] == 1);

    g_RandomHay = g_Hay_Object[0][rand];

    if(!IsValidDynamicObject(g_RandomHay))
    {
        printf("[HayStack] Error occured when processing hay movement (Invalid Object ID picked up. Re-initialized.");
        SendClientMessageToAll(COLOR_RED, "[HayStack] An error occured when attempting to move a haystack: Invalid object ID picked up. Haystack re-initialized.");
        CHay__Destroy();
        CHay__Initialize();
        return;
    }

    g_HayMovement = random (6);
    GetDynamicObjectPos (g_RandomHay, x2, y2, z2);
    x = floatround (x2/-4.0);
    y = floatround (y2/-4.0);
    z = floatround (z2/3.0)-1;

    if ((g_HayMovement == 0)  && (x != 0) && (Hay_Matrix[x-1][y][z] == 0))
    {
        Random_Hay_Calc[rand] = 1;
        Temps = 4000 - CalcChange[0] * z;
        Hay_Speed = SPEED_FACTOR / float (Temps);
        SetTimerEx ("ProcessObject", Temps, 0, "iiii", rand, x, y, z);
        x = x - 1;
        Hay_Matrix[x][y][z] = 1;
        MoveDynamicObject(g_RandomHay, x2+4.0, y2, z2, Hay_Speed);
    }

    else if ((g_HayMovement == 1) && (x != HAY_LENGTH_X-1) && (Hay_Matrix[x+1][y][z] == 0))
    {
        Random_Hay_Calc[rand] = 1;
        Temps = 4000 - CalcChange[0] * z;
        Hay_Speed = SPEED_FACTOR / float (Temps);
        SetTimerEx ("ProcessObject", Temps, 0, "iiii", rand, x, y, z);
        x = x + 1;
        Hay_Matrix[x][y][z] = 1;
        MoveDynamicObject(g_RandomHay, x2-4.0, y2, z2, Hay_Speed);
    }

    else if ((g_HayMovement == 2) && (y != 0) && (Hay_Matrix[x][y-1][z] == 0))
    {
        Random_Hay_Calc[rand] = 1;
        Temps = 4000 - CalcChange[0] * z;
        Hay_Speed = SPEED_FACTOR / float (Temps);
        SetTimerEx ("ProcessObject", Temps, 0, "iiii", rand, x, y, z);
        y = y - 1;
        Hay_Matrix[x][y][z] = 1;
        MoveDynamicObject(g_RandomHay, x2, y2+4.0, z2, Hay_Speed);
    }


    else if ((g_HayMovement == 3) && (y != HAY_WIDTH_Y-1) && (Hay_Matrix[x][y+1][z] == 0))
    {
        Random_Hay_Calc[rand] = 1;
        Temps = 4000 - CalcChange[0] * z;
        Hay_Speed = SPEED_FACTOR / float (Temps);
        SetTimerEx ("ProcessObject", Temps, 0, "iiii", rand, x, y, z);
        y = y + 1;
        Hay_Matrix[x][y][z] = 1;
        MoveDynamicObject (g_RandomHay, x2, y2-4.0, z2, Hay_Speed);
    }

    else if ((g_HayMovement == 4) && (z != 0) && (Hay_Matrix[x][y][z-1] == 0))
    {
        Random_Hay_Calc[rand] = 1;
        Temps = 3000 - CalcChange[1] * z;
        Hay_Speed = SPEED_FACTOR / float (Temps);
        SetTimerEx ("ProcessObject", Temps, 0, "iiii", rand, x, y, z);
        z = z - 1;
        Hay_Matrix[x][y][z] = 1;
        MoveDynamicObject (g_RandomHay, x2, y2, z2-3.0, Hay_Speed);
    }

    else if ((g_HayMovement == 5) && (z != HAY_HEIGHT_Z-1) && (Hay_Matrix[x][y][z+1] == 0))
    {
        Random_Hay_Calc[rand] = 1;
        Temps = 3000 - CalcChange[1] * z;
        Hay_Speed = SPEED_FACTOR / float (Temps);
        SetTimerEx ("ProcessObject", Temps, 0, "iiii", rand, x, y, z);
        z = z + 1;
        Hay_Matrix[x][y][z] = 1;
        MoveDynamicObject (g_RandomHay, x2, y2, z2+3.0, Hay_Speed);
    }
}

public ProcessObject(Hayid, Hay_x, Hay_y, Hay_z)
{
    Random_Hay_Calc[Hayid] = 0;
    Hay_Matrix[Hay_x][Hay_y][Hay_z] = 0;
}


// handle the minigame
#include    Resources/Minigames/Core/HayStack/minigame.pwn