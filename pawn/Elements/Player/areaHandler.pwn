// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

new g_lastAirportGateOpenTime[MAX_PLAYERS];

/*******************************************************************************
*   Las Venturas Playground v2.90 - areahandler.pwn. This file contains        *
*   everything to do with area management in Las Venturas Playground, such as  *
*   gamble areas for casinos, the airport gate, the pirate ship, checkpoint    *
*   areas, etc. This file has been organised by Jay.                           *
*******************************************************************************/

CheckPlayerArea(playerId) {
    if (PlayerSpectateHandler->isSpectating(playerId))
        return;

    if (GetPlayerState(playerId) == PLAYER_STATE_WASTED)
        return;

    CheckpointProcess(playerId);
    AirportGateCheck(playerId);

    if (PlayerInfo[playerId][PlayerStatus] == STATUS_KNOCKOUT && IsPlayerInMinigame (playerId)) {
        new Float:knockoutAreaXmin = 763.2200
           ,Float:knockoutAreaYmin = -72.2000;
                     //Knockout-area: Xmin              Xmax      Ymin              Ymax
        if (IsPlayerInArea (playerId, knockoutAreaXmin, 770.1500, knockoutAreaYmin, -65.1600))
            return;

        new Float: Xko = knockoutAreaXmin + 0.5000 + float (random (4));
        new Float: Yko = knockoutAreaYmin + 0.5000 + float (random (4));

        SetPlayerInterior (playerId, 7);
        SetPlayerPos (playerId, Xko, Yko, 1001);

        SendClientMessage (playerId, COLOR_RED, "Stay in the Boxring!");
        GameTextForPlayer (playerId, "~r~Stay in the Boxring!", 3000, 5);
    }
}

// Function: CheckpointProcess
// if a player is in an area which a checkpoint should show,
// we have to set that checkpoint along with the players status to determine
// which checkpoint id it is there enetring under OnPlayerEnterCheckpoint.
CheckpointProcess(i)
{
    if(IsPlayerInMinigame(i))
        return 0;

#if Feature::DisableRaces == 0
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
#endif

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
    new Float:x
       ,Float:y
       ,Float:z
       ,bool:isPlayerInTaxPoint[MAX_PLAYERS];

    GetPlayerPos(i,x,y,z);

    if(IsPlayerInArea (i, 1695.2847, 1716.2305, 1594.6019, 1622.7753) && z < 16)
    {
        new szMessage[256]
           ,propertyId = PropertyManager->propertyForSpecialFeature(CustomTaxAirportFeature)
           ,endid = propertyId == Property::InvalidId ? Player::InvalidId : Property(propertyId)->ownerId();

        // if the player is near the tax pay-point, and hasn't already payed,
        if(!isPlayerInTaxPoint[i])
        {
            new const tax = GetEconomyValue(AirportCustomsTax);

            isPlayerInTaxPoint[ i ] = true;
            if(GetPlayerMoney(i) < tax && endid != i && !isGateOpen && !IsPlayerInMinigame(i) && GetPlayerState(i) == PLAYER_STATE_DRIVER)
            {
                format(szMessage,sizeof(szMessage),"You need $%s to pay customs tax to enter/exit the airport.", formatPrice(tax));
                ShowBoxForPlayer(i, szMessage);
            }
            else
            {
                new const timeSinceLastAirportTax = Time->currentTime() - g_lastAirportGateOpenTime[i];

                if(GetPlayerMoney(i) >= tax && endid != i && !isGateOpen && GetPlayerState(i) != PLAYER_STATE_PASSENGER && timeSinceLastAirportTax > 15)
                {
                    // we take the money away :> But, only if they have enough!
                    // Is it the airport owner entering the airport?
                    format( szMessage, sizeof( szMessage ), "You've paid $%s custom's tax.", formatPrice(tax) );
                    if(!IsPlayerInMinigame(i))
                    {
                        ShowBoxForPlayer(i, szMessage);
                        TakeRegulatedMoney(i, AirportCustomsTax);

                        g_lastAirportGateOpenTime[i] = Time->currentTime();
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
                    new ownershipShare = GetEconomyValue(AirportCustomsTaxOwnersShare);
                    format(szMessage,256,"* You earned {A9C4E4}$%s customs tax{CCCCCC} from %s (Id:%d).",formatPrice(ownershipShare),PlayerName(i),i);
                    SendClientMessage(endid,Color::ConnectionMessage,szMessage);

                    GiveRegulatedMoney(endid, AirportCustomsTaxOwnersShare);
                }
            }

        }
    }

    if(!IsPlayerInArea (i, 1695.2847, 1716.2305, 1594.6019, 1622.7753))
    {
        isPlayerInTaxPoint[i] = false;
        if(isGateOpen)
        {
            CloseAirportGate();
        }
    }
}

// ------------------------------------------------------------------------------

// Airport gate functions:
OpenAirportGate()
{
    MoveDynamicObject(AirportGate, 1702.365845, 1596.505493, 12.022984 , 3.0 );

    // Open garage sound
    PlaySoundForPlayersInRange(1153, 30, 1702.365845, 1596.505493, 12.022984);
}

CloseAirportGate()
{
    if(briefStatus != BRIEF_STATE_RUNNING)
    {
        MoveDynamicObject(AirportGate, 1705.672852, 1607.490845, 11.840168 , 3.0 );
        // eof open garage sound
        PlaySoundForPlayersInRange(1154, 30, 1702.365845, 1596.505493, 12.022984);
    }
}