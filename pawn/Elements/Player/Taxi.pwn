// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/********************************************************************************
*                                                                               *
*  Las Venturas Playground - Taxi handler                                       *
*                                                                               *
*  This handles everything that has something to do with the taxi system.       *
*                                                                               *
*  @copyright Copyright (c) 2006-2010 Las Venturas Playground                   *
*  @author    Jay                                                               *
*  @package   Handlers                                                          *
*  @version   $Id$                                                              *
*                                                                               *
********************************************************************************/

#define NumberOfTaxiLocations 13

// define the taxi locations
new Float:taxiLocations[NumberOfTaxiLocations][3] =
{
    {2016.5950,1545.0306,10.8308}, // The Ship
    {2284.6868,2453.1343,10.8203}, // Las Venturas Police Department
    {1648.0355,1607.7329,10.8203}, // Las Venturas Airport
    {-2233.3938,-1745.0369,480.8698}, // Mount Chiliad
    {2536.0796,2085.4226,10.8203}, // Ammu-Nation
    {213.4851,1870.4987,17.6406}, // Area 69
    {421.0738,2530.8396,16.6170}, // Airstrip
    {1570.8782,-1309.4750,17.1471}, // Los Santos Basejumping
    {-1219.5400,51.4527,14.1360}, // San Fierro Airport
    {1993.0626,-2362.4480,13.5469}, // Los Santos Airport
    {2419.7612,1124.1425,10.8203}, // LVP Main Bank
    {2851.3525,1290.5934,11.3906}, // LV Train Station
    {2105.8870,2190.4172,14.4965} // LV Fight Club
};

new taxiLocationName[NumberOfTaxiLocations][32] =
{
    "The Ship",
    "Las Venturas Police Department",
    "Las Venturas Airport",
    "Mount Chiliad",
    "Ammu-Nation",
    "Area 69",
    "Airstrip",
    "Los Santos Basejumping",
    "San Fierro Airport",
    "Los Santos Airport",
    "LVP Main Bank",
    "LV Train Station",
    "LV Fight Club"                      
};

new bool:isTaxiActive[MAX_PLAYERS]
   ,Float:playerOrderedTaxiPositionX[MAX_PLAYERS]
   ,Float:playerOrderedTaxiPositionY[MAX_PLAYERS]
   ,Float:playerOrderedTaxiPositionZ[MAX_PLAYERS]
   ,taxiPrice = 200;

ShowTaxiDialog(playerid)
{
    new szTaxiLocations[512];
    for(new i = 0; i < NumberOfTaxiLocations; i++)
    {
        if(i == 0)
        {
            format(szTaxiLocations, sizeof(szTaxiLocations), "%d: %s\r\n", i, taxiLocationName[i]);
        }
        else
        {
            format(szTaxiLocations, sizeof(szTaxiLocations), "%s%d: %s\r\n", szTaxiLocations, i, taxiLocationName[i]);
        }
    }

    ShowPlayerDialog(playerid, DIALOG_TAXI_LOCATIONS, DIALOG_STYLE_LIST, "Kaufman Cabs", szTaxiLocations, "Select", "Cancel");
    return 1;
}

// CancelTaxi(playerid). Used to cancel a taxi for a player.
// returns 1 if the cancel was successful, or 0 if it wasn't (I.E if the player hasn't
// actually orded a taxi, or if he/she isn't connected).

CancelTaxi(playerid)
{
    if(!Player(playerid)->isConnected()) return 0;
    if(playerTaxi[playerid][0] == -1) return 0;

    playerTaxi[playerid][0] = -1;
    isTaxiActive[playerid] = false;

    TextDrawHideForPlayer(playerid, TaxiArrival[playerid]);

    if(GetPlayerSpecialAction(playerid) == SPECIAL_ACTION_USECELLPHONE)
    SetPlayerSpecialAction(playerid,SPECIAL_ACTION_STOPUSECELLPHONE);
    return 1;
}

// TaxiArrived(playerid). This gets called every second when a player has ordered
// a taxi, to calculate the arrival time, and manage when the arrival time is up
// the teleporting of the player. It is badly named, I know. But care

TaxiArrived(playerid)
{
    if(!Player(playerid)->isConnected())
    return 0;

    if(!isTaxiActive[playerid])
        return 0;

    if(playerTaxi[playerid][0] > -1)
    {

        if(IsPlayerInMinigame(playerid))
        {
            CancelTaxi(playerid);
            return 1;
        }

        // Okay, we decrease the seconds.
        playerTaxi[playerid][1]--;

        new str[256];

        // If three seconds have passed, we put away the players cell phone.
        if(Time->currentTime() - playerTaxi[playerid][4] >= 3)
        {
            SetPlayerSpecialAction(playerid,SPECIAL_ACTION_STOPUSECELLPHONE);
        }

        // Now, if all the seconds have passed, we destroy the textdraw and teleport the player.
        if(!playerTaxi[playerid][1])
        {
            // get the id of the player who owns the taxi company for flagging:
            new propertyId = PropertyManager->propertyForSpecialFeature(TaxiCompanyFeature),
                endid = propertyId == Property::InvalidId ? Player::InvalidId : Property(propertyId)->ownerId();

            // can our player afford the fare?
            if(GetPlayerMoney(playerid) < playerTaxi[playerid][3] && playerid != endid)
            {
                CancelTaxi(playerid);
                ShowBoxForPlayer(playerid, "You do not have enough money for the taxi fare.");
                return 1;
            }
            // Is the player in range of where he ordered the taxi?
            if(!IsPlayerInRangeOfPoint(playerid, 850.0, playerOrderedTaxiPositionX[playerid],playerOrderedTaxiPositionY[playerid],playerOrderedTaxiPositionZ[playerid]) && endid != playerid)
            {
                ShowBoxForPlayer(playerid, "The driver could not find you! Please stay in the area in future.");
                CancelTaxi(playerid);
                return 1;
            }


            new
                locateid,
                fare;

            locateid = playerTaxi[playerid][0];

            // Now, if the player who owns the taxi company is connected, we give them
            // a percentage of the money made from taxi's.
            if(Player(endid)->isConnected() && endid != playerid && !IsPlayerInMinigame(endid))
            {
                format(str,256,"* %s (Id:%d) took a taxi to {A9C4E4}%s{CCCCCC}, you earned {A9C4E4}$%d{CCCCCC}.",
                    PlayerName(playerid), playerid,taxiLocationName[locateid],playerTaxi[playerid][3]/10);
                SendClientMessage(endid,Color::ConnectionMessage,str);
                GivePlayerMoney(endid,playerTaxi[playerid][3]/10);
            }

            fare = playerTaxi[playerid][3];
            if(endid != playerid)
            {
                format(str,256,"* Kaufman Cabs: Thank you for using our service! Your fare has come to $%d",fare);
                SendClientMessage(playerid,COLOR_GREEN,str);
                format(str,256,"* at a per kilometer price of $%d.",taxiPrice);
                SendClientMessage(playerid,COLOR_GREEN,str);
            }else{
                SendClientMessage(playerid,COLOR_GREEN,"The taxi driver has dropped you off for free because you own the company.");
            }

            if(locateid != 13)
            {

                SetPlayerInterior(playerid, 0);
                SetPlayerPos(playerid, taxiLocations[locateid][0], taxiLocations[locateid][1], taxiLocations[locateid][2]);
            }

            if(playerid != endid)
            GivePlayerMoney(playerid,-fare);

            mayTax[playerid] = 1;
            format(str, 256,"%s (Id:%d) has /taxi'd to %s (#%d).",PlayerName(playerid),playerid, taxiLocationName[locateid], locateid);
            Admin(playerid, str);

            format(str,256,"~n~~n~~n~~n~~y~KaufMan Cabs:~w~ Dropped off at %s!",taxiLocationName[locateid]);

            GameTextForPlayer(playerid,str,5000,5);
            CancelTaxi(playerid);
            return 1;
        }

        // otherwise just update the arrival textdraw.
        else
        {
            if(IsValidText(TaxiArrival[playerid]))
            {
                new tme[256];

                tme =  ConvertTime(playerTaxi[playerid][1]); // convert the time into MM:SS format
                format(tme, sizeof(tme), "%s", tme);

                TextDrawSetString(TaxiArrival[playerid], tme);
                TextDrawShowForPlayer(playerid, TaxiArrival[playerid]);
            }else{
                SendClientMessage(playerid,COLOR_RED,"Error in taxi - (#25 textdraw string update in TaxiArrived)");
            }
        }
    }
    return 1;
}


FreeTaxi()
{
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        mayTax[i]=0;
    }
}

SendPlayerTaxi(playerid, locateid, fare)
{
    // Get the id of the player who owns the taxi company for flagging:
    new propertyId = PropertyManager->propertyForSpecialFeature(TaxiCompanyFeature),
        endid = propertyId == Property::InvalidId ? Player::InvalidId : Property(propertyId)->ownerId();

    // do they have enough money to pay the fare?
    if(GetPlayerMoney(playerid) < fare)
    {
        if(endid != playerid)
        {
            ShowPlayerBox(playerid, "Kaufman cabs refused to pick you up - you need $%d for the fare.", fare);
            return;
        }
    }

    ShowPlayerBox(playerid, "Kaufman cabs have sent a taxi to your destination. Use /taxi to cancel. The fare will be $%s - make sure you have enough when it arrives!", formatPrice(fare));


    // Now, we set the location id and arrival time, oh, and the fare!
    playerTaxi[playerid][0] = locateid;

    // Right, if the player has used a taxi within the last 3 mins, we set the arrival time
    // as high:
    if(Time->currentTime() - playerTaxi[playerid][4] < 3*60 && endid != playerid)
        playerTaxi[playerid][1] = random(153-58)+58;
    else if (endid == playerid)
        playerTaxi[playerid][1] = 14;
    else
        playerTaxi[playerid][1] = random(14-4)+4;

    playerTaxi[playerid][3] = fare;

    ClearPlayerMenus(playerid);

    // now create the textdraw
    if(!IsValidText(TaxiArrival[playerid]))
    {
        SendClientMessage(playerid, COLOR_RED, "Error in taxi - #1986 Textdraw show.");
        return;
    }

    new time[256];
    time = ConvertTime(playerTaxi[playerid][1]); // convert the time into MM:SS format
    format(time, sizeof(time), "%s", time);

    TextDrawSetString(TaxiArrival[playerid], time);
    TextDrawShowForPlayer(playerid, TaxiArrival[playerid]);

    isTaxiActive[playerid] = true;

    // save the player pos so that we can check if they are in range of the taxi destination.
    GetPlayerPos(playerid, playerOrderedTaxiPositionX[playerid], playerOrderedTaxiPositionY[playerid], playerOrderedTaxiPositionZ[playerid]);

    // Now we need to save the time they taxi'd so we can calculate the taxi
    // arrival time in future, in other words, to check if they have taxi'd within the
    // last 3 minutes.
    playerTaxi[playerid][4] = Time->currentTime();

    // and finally, get there phone out to call the taxi.
    SetPlayerSpecialAction(playerid,SPECIAL_ACTION_USECELLPHONE);
    PlayerPlaySound(playerid, 3600, 0, 0, 0);
}

// return the km price of taxis based on the /taxiprice cmd
GetTaxiKMPrice()
{
    return taxiPrice;
}



//----
// Taxi cmds
// Command: /taxi
// Level: Player
// Parameters: location id/name
// Author: Jay
// Notes: newtaxi has been removed due to unsuage. Popular newtaxi locations can
// be accessed from /taxi 7 and airports.

lvp_taxi(playerid,params[])
{
    // Is our player on the phone? If so, they can't call a taxi.
    if (GetPlayerSpecialAction( playerid ) == SPECIAL_ACTION_USECELLPHONE)
    {
        SendClientMessage(playerid,COLOR_RED,"* You cannot call a taxi because you are currently using the phone. Use /hangup to stop using it.");
        return 1;
    }
    // get the id of the player who owns the taxi company for flagging:
    new propertyId = PropertyManager->propertyForSpecialFeature(TaxiCompanyFeature),
        endid = propertyId == Property::InvalidId ? Player::InvalidId : Property(propertyId)->ownerId();

    // If the player is in ammunation, he shouldn't be calling the taxi! (Menu bug)
    if(GetPlayerInterior(playerid) != 0)
    {
        SendClientMessage(playerid,COLOR_RED,"* You have to be outside to call a taxi.");
        return 1;
    }


    // has our player already called a taxi? If so, we cancel it!
    if(playerTaxi[playerid][0] > -1)
    {

        CancelTaxi(playerid);
        ShowBoxForPlayer(playerid, "Taxi cancelled.");
        // now we get the time the player cancelled, so they can't re-call the company.
        playerTaxi[playerid][5] = Time->currentTime();
        return 1;
    }

    // Has our player got a phone out?
    if(GetPlayerSpecialAction(playerid) == SPECIAL_ACTION_USECELLPHONE)
    {
        ShowBoxForPlayer(playerid, "You can't call a taxi - Get off the phone first!");
        return 1;
    }

    // If the player has just cancelled the taxi, they can't re-call the firm again right away!
    // this prevents abuse to getting the best arrival time, and is more realistic.
    if(Time->currentTime() - playerTaxi[playerid][5] < 60 && endid != playerid)
    {
        ShowBoxForPlayer(playerid, "You have only just cancelled a taxi. Call back later.");
        return 1;
    }

    // If our player is in the VIP room, they can't call a taxi.
    if(iPlayerInVipRoom[playerid])
    {
        ShowBoxForPlayer(playerid, "Step out of the VIP room first.");
        return 1;
    }

    // if our player is on a building or falling or something, how can a taxi get to him?
    new
        Float:x,
        Float:y,
        Float:z;

    GetPlayerPos(playerid, x, y, z);

    if(z > 200 && endid != playerid && GetPlayerInterior(playerid) == 0)
    {
        ShowBoxForPlayer(playerid, "The taxi can't get you from up there!");
        return 1;
    }

    // Ok, if the player just types /taxi on it's own, for now until the taxi menu
    // is complete, we just send a message explaining the parameters.
    if(!params[0])
    {
        new notice[128];

        format(notice, sizeof(notice), "* You can also state a destination using /taxi [0-%d] and get", NumberOfTaxiLocations - 1);
        SendClientMessage(playerid, COLOR_WHITE, notice);
        SendClientMessage(playerid, COLOR_WHITE, "teleported directly to your chosen location! Check /locations too!");

        ShowTaxiDialog(playerid);
        return 1;
    }


    new
        distance,
        fare;

    // Has the player given a taxi ID instead of location name?
    if(IsNumeric(params))
    {
        new locateid = strval(params);

        // if it a valid taxi location?
        if(locateid < 0 || locateid >= NumberOfTaxiLocations)
        {
            ShowTaxiDialog(playerid);
            return 1;
        }

        if(locateid != 13)
        {
            new Float:playerToLocationDistance = GetDistance(playerid, taxiLocations[locateid][0], taxiLocations[locateid][1], taxiLocations[locateid][2]);
            distance = floatround(playerToLocationDistance/50);
        }

        // Now, we calculate the fare based on the taxi price per KM, multiplyed by the distance.
        fare = GetTaxiKMPrice() * distance;

        // is the player already in range of the taxi destination?
        if(distance < 2 && playerid != endid)
        {
            ShowBoxForPlayer(playerid, "You're already close to the taxi destination.");
            return 1;
        }

        SendPlayerTaxi(playerid, locateid, fare);
    }
    return 1;
}



// Command: /taxiprice
// Level: Player
// Parameters: amount
// Author: Jay
// Notes: A property flag command that sets the amount of taxi's per km.

lvp_taxiprice(playerid,params[])
{
    new propertyId = PropertyManager->propertyForSpecialFeature(TaxiCompanyFeature),
        endid = propertyId == Property::InvalidId ? Player::InvalidId : Property(propertyId)->ownerId();

    // does the player own the taxi company?
    if (endid != playerid)
    return 0;

    // have they used the correct params?
    if(!params[0])
    {
        SendClientMessage(playerid,COLOR_WHITE,"Use: /taxiprice [price]");
        return 1;
    }
    // Is it a correct value?
    if(!IsNumeric(params))
    {
        SendClientMessage(playerid,COLOR_RED,"Invalid amount! You can only set it between $0 and $100.");
        return 1;
    }

    new
    taxiprice,
    str[256];

    taxiprice = strval(params);
    // is it a valid value?
    if(taxiprice < 0 || taxiprice > 100)
    {
        ShowBoxForPlayer(playerid, "The KM price must be between $0 and $100.");
        return 1;
    }
    // have they set it within the last 5 minutes?
    if(Time->currentTime() - g_FlagTime[playerid][1] < 60*5)
    {
        ShowBoxForPlayer(playerid, "Sorry, you can only change the fare every 5 minutes.");
        return 1;
    }
    // all clear, set the new price.
    g_FlagTime[playerid][1] = Time->currentTime();
    taxiPrice = taxiprice;
    format(str,256,"~r~~h~%s~w~ has set the taxi kilometer price as ~y~$%d~w~ (~p~/taxiprice~w~)",
        Player(playerid)->nicknameString(), taxiprice);
    NewsController->show(str);
    return 1;
}