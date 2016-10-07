// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/********************************************************************************
*               Las Venturas Playground 3.0 - Export Handler                    *
*                                                                               *
*   The new and completely rewritten export handler for LVP 3.0!                *
*                                                                               *
*       Author: Matthias Van Eeghem                                             *
*       Email: matthiasvaneeghem@hotmail.com
*                                                                               *
********************************************************************************/

#define MAX_WANTEDVEH 20

// Array with the wanted vehicles.
new wantedVehicles[MAX_WANTEDVEH] =
{
    581, 463, 533, 575, 535, 567,
    495, 420, 561, 560, 549, 496,
    541, 415, 558, 521, 471, 568,
    589, 587
};

new wantedVehicle[3];
new amountWantedVehicle[3];
new bool: exportInitialised = false;

forward CExport__NewWantedVehicle();
public CExport__NewWantedVehicle()
{
    exportInitialised = true;

    // Choose a new vehicle that shall be exported.
    new vehID, vehFound[3], bFoo = 1, done[ 3 ];
    for (new i = 0; i < 3; i++)
    {
        while( bFoo )
        {
            vehID = wantedVehicles[ random( MAX_WANTEDVEH ) ];
            if (done[ 0 ] != vehID && done[ 1 ] != vehID && vehID > 400 && vehID < 610)
            break;
        }

        // Make sure we get no doubles
        done [ i ] = vehID;
    }

    // Check the total amount of vehicles available.
    for (new i = 0; i < 580; i++)
    {
        new iModelID = GetVehicleModel( i );
        if (iModelID == -1) continue;

        if(iModelID == done[ 0 ])
        {
            if(vehFound[0] < 15)
            {
                vehFound[0]++;
            }
        }
        if(iModelID == done[ 1 ])
        {
            if(vehFound[1] < 15)
            {
                vehFound[1]++;
            }
        }
        if (iModelID == done[ 2 ])
        {
            if(vehFound[2] < 15)
            {
                vehFound[2]++;
            }
        }
    }

    // Copy information about the cars being exported
    wantedVehicle[ 0 ] = done[ 0 ];
    wantedVehicle[ 1 ] = done[ 1 ];
    wantedVehicle[ 2 ] = done[ 2 ];
    amountWantedVehicle[ 0 ] = vehFound[ 0 ];
    amountWantedVehicle[ 1 ] = vehFound[ 1 ];
    amountWantedVehicle[ 2 ] = vehFound[ 2 ];

    // Format a message to send to all the players;
    new szMessage[ 256 ];
    format( szMessage, sizeof( szMessage ), "* Current Exports: %s", "" );

    for (new i = 0; i < 3; i++)
    {
        format( szMessage, sizeof( szMessage ), "%s   %s (%d needed)", szMessage, VehicleModel(done[i])->nameString(), vehFound[i] );
    }

    // // Format the last part, and send the message to everyone.
    SendClientMessageToAllEx(Color::Green, szMessage );
    SendClientMessageToAllEx(Color::Green, "* And remember, we don't take trashed cars! Check out /export.");
    // In about 6 or 7 minutes we need new wanted vehicles!
    return 1;
}

CExport__CreateMap()
{
    // All credits to [eF]Kase for this map.
    CreateDynamicObject(3458, 2284.8579101563, 603.15881347656, 8.3418426513672, 0, 0, 270, 0);
    CreateDynamicObject(3458, 2289.9626464844, 603.12677001953, 8.3418426513672, 0, 0, 270, 0);
    CreateDynamicObject(3458, 2289.92578125, 562.86328125, 8.3027801513672, 0, 0, 270, 0);
    CreateDynamicObject(3458, 2284.8596191406, 562.88446044922, 8.3027801513672, 0, 0, 270, 0);
    CreateDynamicObject(3458, 2284.8955078125, 538.73901367188, 8.3527793884277, 0, 0, 270, 0);
    CreateDynamicObject(3458, 2289.9494628906, 538.76202392578, 8.3527793884277, 0, 0, 270, 0);
    CreateDynamicObject(1380, 2287.3735351563, 575.18853759766, 31.051277160645, 0, 0, 90, 0);
    CreateDynamicObject(3474, 2287.5063476563, 527.90887451172, 16.801216125488, 0, 0, 180, 0);
    CreateDynamicObject(3620, 2314.2438964844, 548.93402099609, 19.87668800354, 0, 0, 348, 0);
    CreateDynamicObject(1387, 2311.015625, 534.7822265625, 25.875160217285, 0, 0, 355.99548339844, 0);
    CreateDynamicObject(1391, 2249.4462890625, 558.61822509766, 39.311553955078, 0, 0, 0, 0);
    CreateDynamicObject(1394, 2249.4887695313, 558.76806640625, 51.863754272461, 0, 0, 200, 0);
    CreateDynamicObject(16337, 2280.4216308594, 606.64819335938, 9.8203125, 0, 0, 180, 0);
    CreateDynamicObject(10794, 2312.6433105469, 500.95761108398, -0.15999603271484, 0, 0, 0, 0);
    CreateDynamicObject(10795, 2310.32421875, 500.95788574219, 9.9342803955078, 0, 0, 0, 0);
    CreateDynamicObject(10793, 2237.3466796875, 500.96484375, 29.281326293945, 0, 0, 0, 0);
    CreateDynamicObject(8947, 2287.1748046875, 496.21517944336, 12.268310546875, 0, 0, 180, 0);
    CreateDynamicObject(1383, 2289.5756835938, 530.6875, -22.825315475464, 0, 0, 0, 0);
    CreateDynamicObject(1633, 2284.5910644531, 514.85998535156, 9.1149997711182, 352, 0, 0, 0);
    CreateDynamicObject(1633, 2288.4367675781, 514.85382080078, 9.1149997711182, 352, 0, 0, 0);
    CreateDynamicObject(1633, 2290.5983886719, 514.83001708984, 9.1149997711182, 352, 0, 0, 0);
    return 1;
}

CExport__OnEnterCheckpoint( playerid )
{
    if(GetPlayerVirtualWorld(playerid) == 0)
    {
        // Not even in a vehicle, :<
        if( !IsPlayerInAnyVehicle( playerid ) )
        {
            SendClientMessage( playerid, COLOR_ORANGE, "You need to be in a vehicle to export vehicles! To" );
            SendClientMessage( playerid, COLOR_ORANGE, "see which vehicles are wanted, see /export!" );
        }
        else
        {
            // Check if he's in the right vehicle
            new playerVehicleID = GetPlayerVehicleID( playerid );
            new playerVehicleModel = GetVehicleModel( playerVehicleID );
            new bProperVehicle = 0;
            new iPlayerReward;
            new iTempVar = 0;

            // Loop through all the wanted vehicles, check if the models are the same
            for (new i = 0; i < 3; i++)
            {
                if (playerVehicleModel == wantedVehicle[ i ])
                {
                    // Vehicle found! Save it
                    bProperVehicle = wantedVehicle[ i ];
                    iTempVar = i;
                    break;
                }
            }

#if Feature::DisableVehicleManager == 0
            new const personalVehicle = sprayTagPlayerVehicle[playerid]
#else
            new const personalVehicle = -1;
#endif  // Feature::DisableVehicleManager == 0

            // Check if it's not the GTA Vehicle
            if(playerVehicleID  == GTA_Vehicle || playerVehicleID == personalVehicle ||
                (Vehicle(playerVehicleID)->isOpenWorldVehicle() == true && Vehicle(playerVehicleID)->isPersistent() == false)) {
                SendClientMessage(playerid, Color::Error, "Error: You can't export this vehicle.");
                return 1;
            }

            // He's in the correct vehicle
            if( bProperVehicle > 0 )
            {
                // Check the vehicles health
                new Float:fHealth;
                GetVehicleHealth((GetPlayerVehicleID(playerid)), fHealth);

                // Get the vehicle name
                new name[36];
                format(name, sizeof(name), "%s", VehicleModel(bProperVehicle)->nameString());

                // What is he trying to sell us here?!
                if(fHealth <= 370)
                {
                    SendClientMessage(playerid, Color::Red, "Sorry, we don't accept trashed vehicles.");
                    return 1;
                }

                // Do we still need one of those?
                if(amountWantedVehicle[iTempVar] == 0)
                {
                    new string[128];
                    format(string, sizeof(string), "Sorry, we don't need a %s any more! Check /export for vehicles we still need.", name);
                    SendClientMessage(playerid, Color::Red, string);
                    return 1;
                }

                // Respawn his old vehicle
                SetVehicleToRespawn( playerVehicleID );
                // Calculate the reward :o

                iPlayerReward = GetEconomyValue(VehicleExportReward, floatround(fHealth));

                // Decrease the amount of wanted vehicles of that type (only if it's above 0)
                if(amountWantedVehicle[iTempVar] != 0)
                {
                    amountWantedVehicle[iTempVar]--;
                }

                new string[128];
                // Zamg, still in good shape
                if(fHealth >= 800)
                {
                    format( string, sizeof( string ), "Thanks for exporting a %s! Here is your $%s.", name, formatPrice(iPlayerReward) );
                    SendClientMessage( playerid, COLOR_ORANGE, string );
                }
                // Ohwell, still fixable
                else
                {
                    format(string, sizeof(string), "Thanks for exporting a %s! However, since the vehicle isn't in perfect",name);
                    SendClientMessage(playerid, COLOR_ORANGE, string);
                    format(string, sizeof(string), "condition, you only received $%s for it.", formatPrice(iPlayerReward));
                    SendClientMessage(playerid, COLOR_ORANGE, string);
                }

                playerVehExp[ playerid ]++;

                // Give him his money
                GiveRegulatedMoney(playerid, VehicleExportReward, floatround(fHealth));
                format( string, sizeof( string ), "You have already exported %d vehicles!", playerVehExp[ playerid ] );
                SendClientMessage( playerid, COLOR_ORANGE, string );
                CAchieve__Export(playerid, playerVehExp[playerid]);

                Instrumentation->recordActivity(VehicleExportActivity, playerVehicleModel);

                // Somebody has the export prop, let's give him some money too.
                new propertyId = PropertyManager->propertyForSpecialFeature(ExportFeature),
                    endid = propertyId == Property::InvalidId ? Player::InvalidId : Property(propertyId)->ownerId();

                if(Player(endid)->isConnected() && endid != playerid && !IsPlayerInMinigame(endid))
                {
                    new const ownerShare = GetEconomyValue(VehicleExportRewardOwnerShare, floatround(fHealth));

                    format(string, sizeof(string), "%s has exported a %s, you earned $%s.", PlayerName(playerid), name, formatPrice(ownerShare));
                    SendClientMessage(endid, COLOR_GREY, string);

                    TakeRegulatedMoney(endid, VehicleExportRewardOwnerShare, floatround(fHealth));
                }

                //Just a little check for the bonus time
                BonusTime__CheckPlayer(playerid, BONUS_EXPORT);

                // Right, all the cars on the list are exported, start another round!
                if(amountWantedVehicle[0] + amountWantedVehicle[1] + amountWantedVehicle[2] == 0)
                {
                    CExport__NewWantedVehicle();
                }
            }
            else
            {
                // Wrong vehicle
                SendClientMessage( playerid, COLOR_ORANGE, "Sorry, we're currently not accepting this vehicle." );
                SendClientMessage( playerid, COLOR_ORANGE, "Check out /export for vehicles we accept." );
            }
        }
    }
    // Finally.. most annoying function ever edited. Stupid buffer overflows.
    return 1;
}

CExport__OnCommand(playerid)
{
    if (!exportInitialised) {
        SendClientMessage(playerid, COLOR_ORANGE, "Sorry, the export system has not been initialised yet!");
        SendClientMessage(playerid, COLOR_ORANGE, "(You really should not see this. Please tell an admin.)");
        return 1;
    }

    new szMessage[ 256 ];
    SendClientMessage( playerid, COLOR_YELLOW, "The following vehicles are currently wanted:" );
    format( szMessage, sizeof( szMessage ), "The%s", "" );
    for (new i = 0; i < 3; i++)
    {
        if (wantedVehicle[ i ] < 400 || wantedVehicle[ i ] > 610) continue;
        format (szMessage, sizeof( szMessage ), "%s %s (%d needed),", szMessage, VehicleModel(wantedVehicle[i])->nameString(), amountWantedVehicle[ i ]);
    }

    format( szMessage, sizeof( szMessage ), "%s which can be exported at the export point, in the South of Las Venturas.", szMessage );
    SendClientMessage( playerid, Color::White, szMessage );
    SendClientMessage(playerid,Color::White,"The more vehicle damage there is, the less the vehicle is worth!");
    return 1;
}

CExport__EnterVehicle(playerid)
{
    for (new i = 0; i < 3; i++)
    {
        if(GetVehicleModel(GetPlayerVehicleID(playerid)) == wantedVehicle[i] && !IsPlayerInMinigame(playerid) && !IsPlayerInMapZone(playerid) && GetPlayerVehicleID(playerid) != GTA_Vehicle)
        {
            if(amountWantedVehicle[i] != 0)
            {
                SendClientMessage(playerid,COLOR_PINK,"* This vehicle can be exported at the red checkpoint on your radar. Check out /export for more information.");
                SetPlayerCheckpoint(playerid, 2287.8167, 551.0581, 10.8812, 4.0);
                g_InExportVeh[playerid] = true;
            }
        }
    }
    return 1;
}
