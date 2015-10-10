// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
*   Las Venturas Playground v2.90 - areahandler.pwn. This file contains        *
*   everything to do with area management in Las Venturas Playground, such as  *
*   gamble areas for casinos, the airport gate, the pirate ship, checkpoint    *
*   areas, etc. This file has been organised by Jay.                           *
*******************************************************************************/

// Main area timer
stock CheckPlayerArea(playerid)
{
    // Check that the player is valid to proceed with the area check
    if(!Player(playerid)->isConnected()) return 0;
    if(PlayerSpectateHandler->isSpectating(playerid) == true) return 1;

    if(GetPlayerState(playerid) == PLAYER_STATE_WASTED) return 1;
    new i = playerid;

    // Now, check if the player is in a checkpoint area.
    CheckpointProcess(i);

    // What if the player is near the airport? If so, we manage custom tax and stuff.
    AirportGateCheck(i);            

    if(IsPlayerInMinigame(i))
    {
        // Now that we have checked for casino areas and stuff, we have to check
        // for pro admin areas and the ShipTDM minigame:
        new
            Float:x,
            Float:y,
            Float:z;

        // right if the player is in the pro admin area, and there not a pro admin,
        // we have to set them outside.
        GetPlayerPos(i, x, y, z);

        // If there in the knockout minigame and they leave the boxring,
        // we have to set them back inside it!
        if ( isPlayerInArea ( i, inKnockout )  == 0 && PlayerInfo[i][PlayerStatus] == STATUS_KNOCKOUT)
        {
            new Float:Xko = 764.64 + float ( random ( 5 )  ) ;
            new Float:Yko = -70.91 + float ( random ( 6 )  ) ;
            SetPlayerInterior ( i, 7 ) ;
            SetPlayerPos ( i,Xko,Yko,1001 ) ;
            SendClientMessage ( i, COLOR_RED, "Stay in the Boxring!" ) ;
            GameTextForPlayer ( i, "~r~Stay in the Boxring!", 3000, 5 ) ;
        }
    }

    // and thats the end of our checks, for now.
    return 1;
}

// Function: CheckpointProcess
// if a player is in an area which a checkpoint should show,
// we have to set that checkpoint along with the players status to determine
// which checkpoint id it is there enetring under OnPlayerEnterCheckpoint.
CheckpointProcess(i)
{
    if(IsPlayerInMinigame(i))
        return 0;
    if(IsPlayerInVehicle(i,GTA_Vehicle)) {
        for (new j = 0; j < MAX_RACES; j++) {
            TogglePlayerDynamicCP(i, CRace__GetDynamicCheckpointID(j), 0);
            SetPlayerCheckpoint(i, 967.042785, 2072.956054, 10.820302, 5.0);
        }
        return 0; // if the player is in the GTA Car we dont want any checkpoints overriding the minigame!
    } else if(!IsPlayerInVehicle(i,GTA_Vehicle)) {
        for (new j = 0; j < MAX_RACES; j++) {
            TogglePlayerDynamicCP(i, CRace__GetDynamicCheckpointID(j), 1);
        }
    }
    if(PlayerInfo[i][PlayerStatus] == STATUS_DELIVERY)
        return 0; // wait, if there in a mission, we can't have other checkpoints overriding aswell now can we o/

    new
        Float:fPosX,
        Float:fPosY,
        Float:fPosZ;

    GetPlayerPos(i,fPosX,fPosY,fPosZ);

    // Set checkpoints wherever that might be needed;

    // EXPORT CHECKPOINT:
    if (fPosX > 2215.4341 && fPosX < 2373.8655 && fPosY > 484.9250 && fPosY < 646.0396) {
        if (!g_PlayerCpVisible[i]) {
            SetPlayerCheckpoint( i, 2287.8167, 551.0581, 10.8812, 4.0 );
            PlayerInfo[i][LastCheckType] = CP_TYPE_NORMAL;
            PlayerInfo[i][LastCheckID] = CP_INKOOP;
            g_PlayerCpVisible[ i ] = 1;
        }

     } else {
        if (g_PlayerCpVisible[i]) {
            DisablePlayerCheckpoint( i );
            g_PlayerCpVisible[ i ] = 0;
            PlayerInfo[ i ][LastCheckType] = CP_TYPE_NONE;
            PlayerInfo[ i ][LastCheckID] = 0;
        }
    }
    return 1;
}

// AirportGateCheck
// This gets called every second and checks if a player is near the airport gate.
// if a player is near the airport gate, it checks if they have enough to pay
// customs tax, and if they do, it opens the gate. The gate properly opens before it
// closes making it a little more realistic, using OnObjectMoved and the isGateOpen var :D
// Author: Jay.
AirportGateCheck(i)
{
    new
        Float:x,
        Float:y,
        Float:z;

    GetPlayerPos(i,x,y,z);

    if(isPlayerInAreaEx(i,1695.2847,1716.2305,1594.6019,1622.7753) && z < 16)
    {
        new szMessage[256];

        new propertyId = PropertyManager->propertyForSpecialFeature(CustomTaxAirportFeature),
            endid = propertyId == Property::InvalidId ? Player::InvalidId : Property(propertyId)->ownerId();

        // if the player is near the tax pay-point, and hasn't already payed,
        if(!PlayerInPointTax[i])
        {
            PlayerInPointTax[ i ] = true;
            if(GetPlayerMoney(i) < douane && endid != i && !isGateOpen && !IsPlayerInMinigame(i) && GetPlayerState(i) == PLAYER_STATE_DRIVER)
            {
                format(szMessage,sizeof(szMessage),"You need $%d to pay customs tax to enter/exit the airport.",douane);
                ShowBoxForPlayer(i, szMessage);
            }
            else
            {

                if(GetPlayerMoney(i) >= douane && endid != i && !isGateOpen && GetPlayerState(i) != PLAYER_STATE_PASSENGER)
                {
                    // we take the money away :> But, only if they have enough!
                    // Is it the airport owner entering the airport?
                    format( szMessage, sizeof( szMessage ), "You've paid $%d custom's tax.", douane );
                    if(!IsPlayerInMinigame(i))
                    {
                        ShowBoxForPlayer(i, szMessage);
                        GivePlayerMoney( i, -douane );
                    }
                    OpenAirportGate();
                }
            }

            if(endid == i && !isGateOpen)
            {
                if(!IsPlayerInMinigame(i))
                {
                    SendClientMessage(i, COLOR_GREEN,"You don't have to pay customs tax because you own the airport.");
                }
                OpenAirportGate();
            }

            if(endid != i)
            {
                if(Player(endid)->isConnected() && !IsPlayerInMinigame(i))
                {
                    new calc = douane/4;
                    format(szMessage,256,"* You earned {A9C4E4}$%d customs tax{CCCCCC} from %s (Id:%d).",calc,PlayerName(i),i);
                    SendClientMessage(endid,Color::ConnectionMessage,szMessage);
                    GivePlayerMoney(endid, calc);
                }
            }

        }
    }

    if(!isPlayerInAreaEx( i, 1695.2847, 1716.2305, 1594.6019, 1622.7753 ))
    {
        PlayerInPointTax[i] = false;
        if(isGateOpen)
        {
            CloseAirportGate();
        }
    }
}

// ------------------------------------------------------------------------------

// Functions to declare whether a player is in an area:

stock IsPlayerInArea(playerid, Float:x1, Float:y1, Float:x2, Float:y2)
{
    new Float:X, Float:Y, Float:Z;

    GetPlayerPos(playerid, X, Y, Z);
    if(X >= x1 && X <= x2 && Y >= y1 && Y <= y2)
    {
        return 1;
    }
    return 0;
}

isPlayerInArea(cplayerID, Float:data[4])
{
    new Float:X, Float:Y, Float:Z;

    GetPlayerPos(cplayerID, X, Y, Z);

    if(X >= data[0] && X <= data[2] && Y >= data[1] && Y <= data[3]) {

        return 1;
    }
    return 0;
}

// Airport gate functions:
stock OpenAirportGate()
{
    MoveDynamicObject(AirportGate, 1702.365845, 1596.505493, 12.022984 , 3.0 );

    // Open garage sound
    PlaySoundForPlayersInRange(1153, 30, 1702.365845, 1596.505493, 12.022984);
}

stock CloseAirportGate()
{
    if(briefStatus != BRIEF_STATE_RUNNING)
    {
        MoveDynamicObject(AirportGate, 1705.672852, 1607.490845, 11.840168 , 3.0 );
        // eof open garage sound
        PlaySoundForPlayersInRange(1154, 30, 1702.365845, 1596.505493, 12.022984);
    }
}