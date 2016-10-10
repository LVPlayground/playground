// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 *  Las Venturas Playground - Taxi tow handler
 *      
 *  Author: Manuele (Kase) Macchia
 *      
 *  Every player will now be able to get his car to the taxi
 *  location of his choice. The taxi tow system is a simplified
 *  and adapted version of the actual taxi system. No code from
 *  the taxi system was used.   
 */

#define         TOW_FARE                50000           // Tow's set fare.
#define         TOW_MINUTES_WAIT        3               // The number of minutes the player should wait between tows.
#define         NumberOfTowLocations    13              // Number of tow(?) locations.

#define         DIALOG_TOW_COMMAND      8473            // Tow's dialog command (random number, change if in conflict)

// We store here the time (UNIX) when players towed their cars last time.
new lastPlayerTow[MAX_PLAYERS];

// Here there's the list of avaiable towing locations.
// Note: they're different from taxi's.
new Float:towLocations[NumberOfTowLocations][] =
{
    //   X              Y              Z              Ang
    {2040.3169,     1543.9515,      10.3989,        359.8656}, // The Ship
    {2275.3425,     2452.5320,      10.5474,        90.2915}, // Police Station
    {1608.8065,     1620.8003,      10.5474,        178.2039}, // LV Airport
    {-2329.8596,    -1602.7991,     483.4960,       215.9221}, // Mt. Chilliad
    {2532.9568,     2071.4619,      10.4708,        0.1174}, // Ammu-Nation
    {340.6580,      1905.6421,      17.3677,        83.2379}, // Area 69
    {381.2291,      2539.5469,      16.2661,        173.0934}, // Airstrip
    {1573.1437,     -1308.5918,     16.9955,        269.2577}, // Los Santos Basejumping
    {-1341.4988,    -248.8117,      13.8755,        342.4696}, // SF Airport
    {1890.2701,     -2627.1948,     13.2740,        0.2716}, // LS Airport
    {2422.0320,     1113.8469,      10.4708,        0.3177}, // LV Main bank
    {2765.3484,     1281.4395,      10.4771,        269.4123}, // LV Train Station
    {2118.9729,     2179.2515,      10.5671,        0.0375} // LV FightClub
};

// Here we have the tow locations' names.
new towNames[NumberOfTowLocations][] =
{
    "The Ship",
    "Police station",
    "Las Venturas airport",
    "Mount Chilliad",
    "Ammu-Nation",
    "Area 69",
    "Airstrip",
    "Los Santos basejumping",
    "San Fierro airport",
    "Los Santos airport",
    "Main bank",
    "Train station",
    "LV FightClub"
};

/**
 *   Functions
 */

// This is the code called when the player uses the /tow command.
lvp_tow(playerid, params[])
{
    new const price = GetEconomyValue(TeleportWithVehicle);
    new message[128];

    // If the player is an administrator, the following checks do not matter. Using an empty if-statement
    // because the following else-ifs are nicely structured.
    if (Player(playerid)->isAdministrator() && IsPlayerInAnyVehicle(playerid)) {}

    // What if player is on foot?
    else if (!IsPlayerInAnyVehicle(playerid))
        return SendClientMessage(playerid, Color::Red, "Looks like you're on foot... Use /taxi instead!");

    // Does the player have enough money to start a tow?
    else if (GetPlayerMoney(playerid) < price) {
        format(message, sizeof(message), "Using a tow will cost you $%s!", formatPrice(price));
        return SendClientMessage(playerid, Color::Red, message);
    }

    // Secondly, some checks... Let's see if the player has already used tow a while ago!
    else if (!CanPlayerUseTow(playerid))
        return SendClientMessage(playerid, Color::Red, "You already used /tow less than 3 minutes ago! You must wait a bit more.");

    else if (!IsPlayerAllowedToTeleport(playerid))
        return SendClientMessage(playerid, Color::Red, "You can't use /tow because you've recently been in a fight.");

    else if (LegacyIsPlayerInBombShop(playerid))
        return SendClientMessage(playerid, Color::Red, "You can't use /tow because you're in a bomb shop!");

    else if (IsPlayerInMinigame(playerid))
        return SendClientMessage(playerid, Color::Red, "You can't use /tow because you're in a minigame. Use \"/leave\" first.");

    // And what if he's just a passenger?
    else if (GetPlayerVehicleSeat(playerid) > 0)
        return SendClientMessage(playerid, Color::Red, "You have to be driving the vehicle to use this command!");

    // We should also check if he's in a Rhino, it can cause a SA:MP bug.
    else if (GetVehicleModel(GetPlayerVehicleID(playerid)) == 432)
        return SendClientMessage(playerid, Color::Red, "You can't tow a Rhino!");

    // Lets also block town for vortexes to prevent the annoying driveby's with it.
    else if (GetVehicleModel(GetPlayerVehicleID(playerid)) == 539)
        return SendClientMessage(playerid, Color::Red, "You can't teleport a Vortex!");

    else if (VehicleModel(GetVehicleModel(GetPlayerVehicleID(playerid)))->isAirplane())
        return SendClientMessage(playerid, Color::Red, "You can't teleport airplanes!");

    new location = Command->integerParameter(params, 0);

    if (Command->parameterCount(params) < 1)
    {
        new list[256];
        for(new i = 0; i < NumberOfTowLocations; ++i)
            format(list, sizeof(list), "%s%d. %s\r\n", list, i, towNames[i]);

        ShowPlayerDialog(playerid, DIALOG_TOW_COMMAND, DIALOG_STYLE_LIST, "Where do you want to go?", list, "Tow!", "Cancel");
    }
    else
    {
        // Is the ID valid?
        if(location < 0 || location >= NumberOfTowLocations)
            return SendClientMessage(playerid, Color::Red, "You entered an invalid location ID!");

        // Lets take their money and tow them!
        if (Player(playerid)->isAdministrator() == false)
            TakeRegulatedMoney(playerid, TeleportWithVehicle);

        TowPlayer(playerid, location);
    }

    return 1;
}

// This is the function which teleports the player and its car to a certain location!
TowPlayer(playerid, locationid)
{
    if (locationid < 0 || locationid >= NumberOfTowLocations)
        return 0;

    new vid = GetPlayerVehicleID(playerid);
    SetVehiclePos(vid, towLocations[locationid][0], towLocations[locationid][1], towLocations[locationid][2]);
    SetVehicleZAngle(vid, towLocations[locationid][3]);

    // We also set the time variable...
    lastPlayerTow[playerid] = Time->currentTime();

    // Finally, we send him a message!
    SendClientMessage(playerid, COLOR_YELLOW, "You've been dropped at the chosen location!");

    new adminNotice[128], sPlayerName[MAX_PLAYER_NAME+1];
    GetPlayerName(playerid, sPlayerName, sizeof(sPlayerName));
    format(adminNotice, sizeof(adminNotice), "%s (Id:%d) has /tow'd to %s (#%d).",PlayerName(playerid),playerid, towNames[locationid], locationid);
    Admin(playerid, adminNotice);

    return 1;
}

// This function checks if the player is able to use tow right now.
CanPlayerUseTow(playerid)
{
    // If the player hasn't used tow yet, we let him!
    if(!lastPlayerTow[playerid])
        return true;

    // We let him use tow if last time he used it was more than a defined amount of minutes ago too.
    else if(Time->currentTime() - lastPlayerTow[playerid] > 60 * TOW_MINUTES_WAIT)
        return true;

    // If the previous conditions aren't true, then we don't let him use tow.
    else
        return false;
}
