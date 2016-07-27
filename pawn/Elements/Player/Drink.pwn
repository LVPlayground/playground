// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*

One of Las Venturas Playground 2.9's new features -- a pub. Seriously, this will
be cool, as you can go to your local pub and drink to your heart's content. The
more you drink, the more fucked you get. The harder it is to do things, and it'll
generally be a laugh.

Author: Tomos Jenkins -- tomozj

*/

// Variables
new drinkData[2];
new drinksData[9][2];
new playerAlcohol[MAX_PLAYERS];
new playerService[MAX_PLAYERS];
new playerDrinkTimer[MAX_PLAYERS];
new playerUsedMenu[MAX_PLAYERS];
new playerDrinkDead[MAX_PLAYERS];
new playerDrinkID[MAX_PLAYERS];
new playerSwigs[MAX_PLAYERS];
new drunkAnimation[MAX_PLAYERS];
new iPlayerSwigTime[MAX_PLAYERS];
new Menu:drinkMenu;


// Defines
#define DRINK_COSTPERUNIT   1000
#define DRINK_DRUNKLVL      10
#define DRINK_DEADLVL       90
#define DRINK_UNITLOSS      120     // seconds
#define DRINK_MULTIPLYER    7000    // Calculates how drink you get

#define SWIGS_PER_BOTTLE    5

// CDrink__Initialize
// This function starts things up at the beginning of the gamemode.
CDrink__Initialize()
{
    CDrink__SetVars(true);
}

// CDrink__ResetVars
// Sets the variables to their default values. This lowers the chance of bugs
// from occurring. :)
CDrink__SetVars(bool:all = false)
{
    if(all == true) {
        // Main drink data array
        drinkData[0] = 1; // isPubOpen
        drinkData[1] = -1; // Biggest drunk!
    }

    // Alcohol units in each of the drinks
    drinksData[0][0] = CDrink__RandAlcoholVolume(2, 3); // Wine         $2000
    drinksData[1][0] = CDrink__RandAlcoholVolume(1, 2); // Beer         $1000
    drinksData[2][0] = CDrink__RandAlcoholVolume(1, 2); // Cider        $1000
    drinksData[3][0] = CDrink__RandAlcoholVolume(1, 3); // Alcopop      $2000
    drinksData[4][0] = CDrink__RandAlcoholVolume(2, 6); // Cocktail     $3000
    drinksData[5][0] = CDrink__RandAlcoholVolume(1, 1); // Shots        $1000
    drinksData[6][0] = CDrink__RandAlcoholVolume(5, 8); // Vodka        $5000
    drinksData[7][0] = CDrink__RandAlcoholVolume(5, 8); // Whisky       $5000
    drinksData[8][0] = -5;                              // Sprunk       $FREE

    // And their prices
    drinksData[0][1] = drinksData[0][0] * DRINK_COSTPERUNIT;
    drinksData[1][1] = drinksData[1][0] * DRINK_COSTPERUNIT;
    drinksData[2][1] = drinksData[2][0] * DRINK_COSTPERUNIT;
    drinksData[3][1] = drinksData[3][0] * DRINK_COSTPERUNIT;
    drinksData[4][1] = drinksData[4][0] * DRINK_COSTPERUNIT;
    drinksData[5][1] = drinksData[5][0] * DRINK_COSTPERUNIT;
    drinksData[6][1] = drinksData[6][0] * DRINK_COSTPERUNIT;
    drinksData[7][1] = drinksData[7][0] * DRINK_COSTPERUNIT;
    drinksData[8][1] = 0;


    // Reset the alcohol for everyone maybe
    if(all == true) {
        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++) {
            CDrink__ResetPlayerVars(i);
        }
    }
}

// CDrink__ResetPlayerVars
// Resets the player variables.
CDrink__ResetPlayerVars(playerid)
{
    playerAlcohol[playerid] = 0;
    playerService[playerid] = 0;
    playerDrinkTimer[playerid] = DRINK_UNITLOSS;
    playerUsedMenu[playerid] = 0;
    playerDrinkDead[playerid] = 0;
    playerSwigs[playerid] = 0;
    drunkAnimation[playerid] = 0;
    playerDrinkID[playerid] = 0;
    iPlayerSwigTime[playerid] = 0;

}

// CDrink__RandAlcoholVolume
// Calculated the alcohol volume randomly when a min and max value is given.
CDrink__RandAlcoholVolume(min, max)
{
    if(min == max) return min;
    new out = random(max-min);
    out = out + min;
    return out;
}

// CDrink__String
// Converts an int to a string -- makes stuff easier.
CDrink__String(int, money = 0)
{
    new string[64];
    if(money == 0) {
        format(string, 64, "%d", int);
    } else {
        format(string, 64, "$%d", int);
    }
    return string;
}

// CDrink__BuildMenus
// Builds the menus at gamemode runtime
CDrink__BuildMenus()
{
    drinkMenu = CreateMenu("~g~The Bar", 2, 200.0, 200.0, 150.0, 150.0);

    // Columns
    SetMenuColumnHeader(drinkMenu, 0, "Drink");
    SetMenuColumnHeader(drinkMenu, 1, "Cost");

    // Content - Drink
    AddMenuItem(drinkMenu, 0, "Wine");
    AddMenuItem(drinkMenu, 0, "Beer");
    AddMenuItem(drinkMenu, 0, "Cider");
    AddMenuItem(drinkMenu, 0, "Alcopop");
    AddMenuItem(drinkMenu, 0, "Cocktail");
    AddMenuItem(drinkMenu, 0, "Shot");
    AddMenuItem(drinkMenu, 0, "Vodka");
    AddMenuItem(drinkMenu, 0, "Whisky");
    AddMenuItem(drinkMenu, 0, "Sprunk (Sober up)");

    // Content - Cost
    AddMenuItem(drinkMenu, 1, CDrink__String(drinksData[0][1], 1)); // Wine
    AddMenuItem(drinkMenu, 1, CDrink__String(drinksData[1][1], 1)); // Beer
    AddMenuItem(drinkMenu, 1, CDrink__String(drinksData[2][1], 1)); // Cider
    AddMenuItem(drinkMenu, 1, CDrink__String(drinksData[3][1], 1)); // Alcopop
    AddMenuItem(drinkMenu, 1, CDrink__String(drinksData[4][1], 1)); // Cocktail
    AddMenuItem(drinkMenu, 1, CDrink__String(drinksData[5][1], 1)); // Shot
    AddMenuItem(drinkMenu, 1, CDrink__String(drinksData[6][1], 1)); // Vodka
    AddMenuItem(drinkMenu, 1, CDrink__String(drinksData[7][1], 1)); // Whisky
    AddMenuItem(drinkMenu, 1, "~b~FREE");                           // Sprunk
}


// CDrink__Buy
// This handles all of the cash side of stuff, then calls CDrink__Drink
CDrink__Buy(playerid, drinkid)
{
    // Lets just get stuff in our own variable.
    new price = drinksData[drinkid][1];

    if(GetPlayerSpecialAction(playerid) != SPECIAL_ACTION_NONE)
    {
        ShowBoxForPlayer(playerid, "You can only buy one drink at a time!");
        return 1;
    }

    // They have to be able to afford it..
    if(GetPlayerMoney(playerid) < price)
    {
        ShowBoxForPlayer(playerid, "You don't have enough money!");
        return 1;
    }

    new propertyId = PropertyManager->propertyForSpecialFeature(BarFeature),
        endid = propertyId == Property::InvalidId ? Player::InvalidId : Property(propertyId)->ownerId();

    GivePlayerMoney(playerid, -price); // XXXXXXXXXXXXXXXXXX Drinks
    playerDrinkID[playerid] = drinkid;
    CDrink__Drink(playerid);

    if(drinkid == 0) {
        SetPlayerSpecialAction(playerid, SPECIAL_ACTION_DRINK_WINE);
    } else if(drinkid != 8) {
        SetPlayerSpecialAction(playerid, SPECIAL_ACTION_DRINK_BEER);
    } else {
        SetPlayerSpecialAction(playerid, SPECIAL_ACTION_DRINK_SPRUNK);
    }

    if(Player(endid)->isConnected() && endid != playerid)
    {
        new str[256];
        format(str,256,"* %s bought a drink! You earned $%d.",PlayerName(playerid),price/10);
        SendClientMessage(endid,COLOR_GREY,str);
        GivePlayerMoney(endid,price/10); // XXXXXXXXXXXXXXXXXX Drinks (bar owner share)
    }
    return 1;
}

// CDrink__Drink
// This is called when a player drinks.. a drink. We need to change the level
// of alcohol in their blood, tell them about it, change the drink variables.
CDrink__Drink(playerid)
{

    // Alright, lets make them fucked if need be.
    if(playerAlcohol[playerid] >= DRINK_DRUNKLVL) {
        drunkAnimation[playerid] = 1;
        return 1;
    }

    ClearAnimations(playerid);
    drunkAnimation[playerid] = 0;
    return 1;
}

// CDrink__DrinkBottle
// Called from OnPlayerKeyStateChange to detect when
// a player drinks a bottle. Players can only have 3 swigs
// then they have to go buy another from the bar
CDrink__DrinkBottle(playerid)
{
    playerSwigs[playerid]++;
    iPlayerSwigTime[playerid] = Time->currentTime();

    new drinkid = playerDrinkID[playerid];
    new alcohol = drinksData[drinkid][0];
    new string[128];

    if(playerAlcohol[playerid] > 5)
        SetPlayerDrunkLevel(playerid, DRINK_MULTIPLYER*alcohol);

    // Brilliant! Now, we need to alter their settings
    if(drinkid < 8)
    {
        playerAlcohol[playerid] = playerAlcohol[playerid] + alcohol;
        CAchieve__Drink(playerid, playerAlcohol[playerid]);

        new name[24];
        GetPlayerName(playerid, name, 24);
        format(string, 128, "You have now consumed a total of %d units of alcohol %s. %s", playerAlcohol[playerid], name, CDrink__GenDrinkString(playerid));
        ShowBoxForPlayer(playerid, string);

    } else {
        playerAlcohol[playerid] = playerAlcohol[playerid] - 1;

        if(playerAlcohol[playerid] <= 0)
        {
            // Sober!
            ShowBoxForPlayer(playerid, "Well done, you are sober!");
            playerAlcohol[playerid] = 0;
            SetPlayerDrunkLevel(playerid, 0);
        }
    }

    if(playerSwigs[playerid] == SWIGS_PER_BOTTLE)
    {
        playerSwigs[playerid] = 0;
        ShowBoxForPlayer(playerid, "All gone! Buy another drink at the bar.");
        SetPlayerSpecialAction(playerid, SPECIAL_ACTION_NONE);
    }
}

// CDrink__GenDrinkString
// This function generates the string needed at the end of the message given to
// the player when they've bought a drink -- the string varies depending on how
// much they've drunk.
CDrink__GenDrinkString(playerid)
{
    new alcohol = playerAlcohol[playerid], string[64];
    if(alcohol < 20)
        format(string, 64, "Enjoy!");
    else if(alcohol < 40)
        format(string, 64, "Enjoy, but take it easy.");
    else if(alcohol < 60)
        format(string, 64, "You're looking pretty fucked!");
    else if(alcohol < 75)
        format(string, 64, "Make sure you don't go too far.");
    else if(alcohol < 85)
        format(string, 64, "Know your limit!");
    else
        format(string, 64, "Stop now!!");

    return string;
}

// CDrink__ShowMenu
// This function shows the drinks menu for the player, simple!
CDrink__ShowMenu(playerid)
{
    if(GetPlayerState(playerid) != PLAYER_STATE_ONFOOT)
        return 0;

/*  if(IsValidMenu(drinkMenu) && g_PlayerMenu[playerid] == 0)
    USELESS CHECK AND JUST CAUSES AN ISSUE WITH THE BAR MENU SOMETIMES FAILING TO SHOW
    {*/
        new string[128], name[24];
        GetPlayerName(playerid, name, 24);
        format(string, 128, "Welcome to the bar %s! What would you like to drink?", name);
        SendClientMessage(playerid, COLOR_YELLOW, string);
        ShowMenuForPlayer(drinkMenu, playerid);
        g_PlayerMenu[playerid] = 1;
        TogglePlayerControllable(playerid, 0);
        playerUsedMenu[playerid] = 1;
        g_PlayerMenu[playerid] = true;
        return 1;
//  }
//  return 1;
}

// CDrink__HideMenu
// You guessed it.. this functions hides the drinks menu for the player.
CDrink__HideMenu(playerid)
{
    if(IsValidMenu(drinkMenu)) {
        HideMenuForPlayer(drinkMenu, playerid);
        g_PlayerMenu[playerid] = 0;
        TogglePlayerControllable(playerid, 1);
    }
}

// CDrink__Connect
// When a player connects, this is called.
CDrink__Connect(playerid)
{
    SetPlayerDrunkLevel(playerid, 0);
    CDrink__ResetPlayerVars(playerid);
}

// CDrink__Disconnect
// When a player disconnects, this is called.
CDrink__Disconnect(playerid)
{
    SetPlayerDrunkLevel(playerid, 0);
    CDrink__ResetPlayerVars(playerid);
}

// CDrink__Spawn
// When a player spawns, this is called.
CDrink__Spawn(playerid)
{
    SetPlayerDrunkLevel(playerid, 0);
    CDrink__ResetPlayerVars(playerid);
}

// CDrink__ProcessPlayer
// This timer runs every second -- used to check the location of the player
// in the pub (if they're at the bar, they need to be served!).
CDrink__ProcessPlayer(i)
{
    // Animation!
    if(drunkAnimation[i] == 1)
    {
        if(IsPlayerInAnyVehicle(i)) {
            // No animations!
        } else if(Time->currentTime() - iPlayerSwigTime[i] >= 3)
        {
            if(GetPlayerDrunkLevel(i) > 10000)
            {
                // Just incase, 10000 is fine
                ApplyAnimation(i,"PED","WALK_DRUNK",4.1,1,1,1,1,1);
            } else {
                // Something fucked up!
                printf("[CDrink] Animation seems to have fucked up on id %d.", i);
                ClearAnimations(i);
                drunkAnimation[i] = 0;
            }
        }
    }

    // Alcohol auto-decreaser over time.
    if(playerAlcohol[i] > 0) {
        if(playerDrinkTimer[i] == 0) {
            // Time for a decrease of 2 units of alcohol.
            playerAlcohol[i] = playerAlcohol[i] - 5;
            SetPlayerDrunkLevel(i, GetPlayerDrunkLevel(i)-(5 * DRINK_MULTIPLYER));
            if(playerAlcohol[i] < 1)
            {
                playerAlcohol[i] = 0;
                ShowBoxForPlayer(i, "Well done, you are sober!");
                SetPlayerDrunkLevel(i, 0);
            }
            if(playerAlcohol[i] < DRINK_DRUNKLVL)
            {
                drunkAnimation[i] = 0;
            }
            playerDrinkTimer[i] = 300;
        }
        playerDrinkTimer[i]--;
    }

    // Check if they're at the bar
    if((GetPlayerInterior(i) == 11 || GetPlayerInterior(i) == 0) && GetPlayerState(i) == PLAYER_STATE_ONFOOT)
    {
        // They're in the right interior!
        new Float:x, Float:y, Float:z;
        GetPlayerPos(i, x, y, z);
        // BAR // start 502.0508,-75.2472,998.7651 // end 491.1106,-82.9000,998.7578

        // VIP-ROOM BAR // start 2121.3491,2398.2051,10.8333 // end 2124.5847,2407.2861,10.8309


        if( ( (x > 491.1106 && x < 502.0508) && (y > -82.9000 && y < -75.2472) && (z > 900) ) ||
                ( (x > 2121.3491 && x < 2124.5847) && (y > 2398.2051 && y < 2407.2859) && (z > 9 && z < 12) )) {
            // at the bar!
            if(GetPlayerMenu(i) == drinkMenu && g_PlayerMenu[i] == 1) {
                // Do nothing!
            } else if(playerUsedMenu[i] == 1 || playerAlcohol[i] >= DRINK_DEADLVL) {
                // fucked
            } else if(playerService[i] == 0) {
                // Just walked in
                ShowBoxForPlayer(i, "Please wait to be served...");
                playerService[i]++;
            } else if(playerService[i] < 2) {
                // Still waiting
                playerService[i]++;
            } else {
                // Waited long enough!
                CDrink__ShowMenu(i);
                playerService[i] = 0;
            }
        } else {
            // We have to check if they ran in, and then out again -- if so,
            // we simply reset their service time to zero.
            if(playerService[i] > 0) {
                playerService[i] = 0;
            }
            // Also, we wanna close the menu if it's open.
            if(GetPlayerMenu(i) == drinkMenu && g_PlayerMenu[i] == 1) {
                CDrink__HideMenu(i);
            }
            playerUsedMenu[i] = 0;
        }
    }
}

// CDrink__MenuProcess
// This is called when a menu item is hit -- on any menu.
CDrink__MenuProcess(playerid, row)
{
    if(GetPlayerMenu(playerid) == drinkMenu) {
        // It's our menu -- and the row id is equals to the drink id.. bingo.
        if(GetPlayerInterior(playerid) != 11 && GetPlayerInterior(playerid) != 12 && GetPlayerInterior(playerid) != 0)
        {
            SendClientMessage(playerid, Color::Red, "You're not at the bar!");
        } else {
            CDrink__Buy(playerid, row);
            CDrink__HideMenu(playerid);
        }
    }
}

// CDrink__OnKey
// This is called whenever a key is pressed. Handled here, because Jay sucks
CDrink__OnKey(playerid, newkeys)
{
    if((newkeys & (KEY_FIRE)) == (KEY_FIRE)) {
        // Get this
        new nAction = GetPlayerSpecialAction(playerid);
        new nState = GetPlayerState (playerid);

        if(nState == PLAYER_STATE_ONFOOT)
        {
            if (nAction >= SPECIAL_ACTION_DRINK_BEER && nAction <= SPECIAL_ACTION_DRINK_SPRUNK)
            {
                if(nAction != SPECIAL_ACTION_SMOKE_CIGGY)
                {
                    CDrink__DrinkBottle(playerid);
                }
            }
        }
    }
}
