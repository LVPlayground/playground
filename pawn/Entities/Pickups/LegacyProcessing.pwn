// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

LegacyOnPlayerPickUpPickup(playerid, pickupid)
{
    new playerVipRoomEntryTime[MAX_PLAYERS];

    // First of all check for derby pickups
    if(CDerby__CheckPlayerPickupPickup(playerid, pickupid) == 1)
    {
        return 1;   // done \o
    }

    // Capture the briefcase
    if(CBrief__CheckPickup(playerid, pickupid))
    {
        return 1;
    }

    // Bag of cash
    if(BagCash__CheckPickup(playerid, pickupid))
    {
        return 1;
    }

    // Other pickup ID's, added the SendClientMessage for debugging purposes.
    if (pickupid == g_iShipIcon && g_VirtualWorld[ playerid ] == 0)
    {
        if(!sKillTime) {
            SendClientMessage( playerid, COLOR_ORANGE, "The Pirate Ship on Las Venturas Playground is a safe-zone," );
            SendClientMessage( playerid, COLOR_ORANGE, "you are NOT allowed to fight, kill, hit, slap or have sexual" );
            SendClientMessage( playerid, COLOR_ORANGE, "intercourse with anyone on the pirate ship!" );

            if(Player(playerid)->isRegular() == false)
                GameTextForPlayer(playerid,"The ship is a peace zone!",1000,6);

        } else if(sKillTime)
            SendClientMessage(playerid,COLOR_GREEN,"It's Killtime! Shooting on the ship is temporarily allowed.");

        return 1;
    }

#if Feature::EnableFightClub == 0
    // FightClub 'FCDPickup' (duel or watch)
    // Author: iou
    if(pickupid == FCDPickup)
    {
        if(!FightClubDialogEnabled) return false;
        if(FightClubDialog[playerid]) return false;
        if(DamageManager(playerid)->isPlayerFighting() == true)
            return SendClientMessage(playerid, COLOR_RED, "* You were recently in a gunfight, thus this is inaccessible.");
        if(IsPlayerWatchingFC[playerid]) return false;

        CFightClub__ShowDialog(playerid, DIALOG_FIGHTCLUB);
        return 1;
    }

    // Pickup near FC, giving info about /fight
    if(pickupid == FCPickup)
    {
        SendClientMessage(playerid, COLOR_RED, "----------------------");
        SendClientMessage(playerid, COLOR_YELLOW, "Want to challenge someone to a fair fight? Find the Death Skull on this roof to get started!");
        SendClientMessage(playerid, COLOR_YELLOW, "Alternatively use '/fight invite'.");
        SendClientMessage(playerid, COLOR_YELLOW, "People can watch this fight as well.");
        SendClientMessage(playerid, COLOR_YELLOW, "See '/fight' and '/fight help' for more info!");
        SendClientMessage(playerid, COLOR_RED, "----------------------");
        return 1;
    }
#endif

    // Train icons near stations all around San Andreas showing the player some information about the trains.
    // Author: Matthias

    if((pickupid == g_TrainPickup_0) || (pickupid == g_TrainPickup_1) || (pickupid == g_TrainPickup_2) ||
            (pickupid == g_TrainPickup_3) || (pickupid == g_TrainPickup_4))
    {
        SendClientMessage(playerid, COLOR_YELLOW, "* You've arrived at a train station, a train stops by here");
        SendClientMessage(playerid, COLOR_YELLOW, "* every once in a while, press g to enter it when it arrives.");
        return 1;
    }

    if(pickupid == g_CrushIcon)
    {
        SendClientMessage(playerid,COLOR_WHITE,"* Park a vehicle into the allocated area to crush it and receive a scrap value!");
        SendClientMessage(playerid,COLOR_WHITE,"* You receive a higher scrap value for the vehicles condition, i.e modifcations, health, etc.");
        return 1;
    }

    if(pickupid == Vip) // if a player pickups the vip icon
    {

        if(playerVipRoomEntryTime[playerid] != 0)
        {
            if(Time->currentTime() - playerVipRoomEntryTime[playerid] < 5)
            {
                return 1;
            }
        }

        playerVipRoomEntryTime[playerid] = 0;

        // GivePlayerMoney(playerid,-1000); // When you pickup the $ icon, GTASA by default gives you $1000, so we need to take that away!
        if(chaseData[1] == playerid && chaseData[0] == 1)
        {
            // The chase is active, they're trying to escape to the VIP room..
            SendClientMessage(playerid, COLOR_RED, "Access denied. We don't house fugitives.");
            return 1;
        }

        if(!Player(playerid)->isVip())
        {
            SendClientMessage(playerid,COLOR_RED,"This pickup gives access to the VIP Room.");
            SendClientMessage(playerid,COLOR_RED,"You being an ordinary player, denies you access to it.");
            SendClientMessage(playerid,COLOR_RED,"For more information, check out /donate!");
            return 1;
        }

        SetPlayerPos(playerid, 2127.3569, 2386.5317, 10.8378);
        playerVipRoomEntryTime[playerid] = Time->currentTime();
        iPlayerInVipRoom[playerid] = true;
        SetPlayerTeam(playerid, 1);
        return 1;
    }

    // Player is leaving the VIP room so teleport them to the outside pickup position
    if(pickupid == VipExit)
    {
        if(playerVipRoomEntryTime[playerid] != 0)
        {
            if(Time->currentTime() - playerVipRoomEntryTime[playerid] < 5)
            {
                return 1;
            }
        }

        SetPlayerPos(playerid, 2127.4788,2370.5847,10.8203); // set em back to outside the pickup!
        playerVipRoomEntryTime[playerid] = Time->currentTime();
        iPlayerInVipRoom[playerid] = false;
        SetPlayerTeam(playerid, NO_TEAM);
        return 1;
    }

    // Airports:
    // Quite simple how it works. When a player picks up the pickup, simply show the menu!
    if(!g_PlayerMenu[playerid] && !IsPlayerInMinigame(playerid))
    {
        if(Time->currentTime() - AirTime[playerid] < 60)
        {
            SendClientMessage(playerid,COLOR_RED,"There are no flights departing right now! Try again later.");
            return 1;
        }
        g_PlayerMenu[ playerid ] = 1;

        if (pickupid == g_AirportPickup[0])
        {
            ShowMenuForPlayer(AirportMenu[0],playerid);
            TogglePlayerControllable(playerid,false);
            return 1;
        }
        if (pickupid == g_AirportPickup[1])
        {
            ShowMenuForPlayer(AirportMenu[1],playerid);
            TogglePlayerControllable(playerid,false);
            return 1;
        }
        if (pickupid == g_AirportPickup[2])
        {
            ShowMenuForPlayer(AirportMenu[2],playerid);
            TogglePlayerControllable(playerid,false);
            return 1;
        }
        if (pickupid == g_AirportPickup[3])
        {
            ShowMenuForPlayer(AirportMenu[3],playerid);
            TogglePlayerControllable(playerid,false);
            return 1;
        }
    }

    return 1;
}
