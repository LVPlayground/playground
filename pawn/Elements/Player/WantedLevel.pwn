// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
 *      LVP 2.93.6                                                             *
 *          @Name - WantedLevel                                                *
 *                                                                             *
 *          @Description - This file contains all functions related to the     *
 *                         wantedlevel system, such as kill checking or        *
 *                         deathmatch champion.                                *
 *                                                                             *
 *******************************************************************************/

new iServerKillRecord = 10;

WantedLevel__OnPlayerDeath (playerid, killerid) {
    // First, we reset the wanted level for the player that has died.
    //  SetPlayerWantedLevel(playerid,0);
    //  WantedLevel[playerid] = 0;


    // Now, if the killer isn't connected or in a minigame, we don't need to do anything more.
    if(!Player(killerid)->isConnected() || IsPlayerInMinigame(killerid))
        return 0;


    // Create some vars to store wanted level data in...
    new
    iWantedLevel,
    iStr[256],
    iKillValue;

    // Now we increase the amount of kills the killer has 'in a row' and calculate
    // A wanted level using this, and set the players stars appropiately.
    WantedLevel[killerid]++;
    iWantedLevel = GetWantedLevel(killerid,WantedLevel[killerid]);
    SetPlayerWantedLevel(killerid,iWantedLevel);

    // Calculate a bounty for this player
    iKillValue = iWantedLevel * 10000;



    // If a player has more than a 3 star wanted level, we have to process a message
    // to tell everyone how many kills he/she has, and how much of a bounty they have!
    if(WantedLevel[killerid] > 3)
    {
        // But wait, first we check if this player has more than the record.
        // If so, we have to congulate them with a nice reward and set the new record!
        if(WantedLevel[killerid] > iServerKillRecord /*&& playerExists[killerid]*/)
        {
            // Only set the new champion if the player isn't the champion already...
            if(iServerChampion != killerid)
            {
                SendClientMessageToAllEx(Color::White,"--------------------------------------");
                format(iStr,sizeof(iStr),"* %s (Id:%d) has broken %s's killstreak of %d kills and is the new Deathmatch Champion!",
                PlayerName(killerid),killerid,iRecordName,iServerKillRecord,PlayerName(killerid));
                SendClientMessageToAllEx(COLOR_YELLOW,iStr);
                SendClientMessageToAllEx(Color::White,"--------------------------------------");

                format(iStr,sizeof(iStr),"~g~New Deathmatch Champion~n~~y~Congratulations~n~~w~$%s",formatPrice(GetEconomyValue(DeathmatchChampion)));
                GameTextForPlayer(killerid,iStr,5000,0);

                GiveRegulatedMoney(killerid,DeathmatchChampion);
                iServerKillRecord = WantedLevel[killerid];
                GetPlayerName(killerid,iRecordName,sizeof(iRecordName));
                iServerChampion = killerid;
            }else{
                // Right, if the DM champion is getting more and more kills, just increase the record...
                format(iStr,sizeof(iStr),
                    "* %s (Id:%d) has {A9C4E4}%d kills{CCCCCC} in a row - {A9C4E4}The New Server Record by the Deathmatch Champion{CCCCCC}!",
                    PlayerName(killerid),killerid,WantedLevel[killerid]);
                SendClientMessageToAllEx(Color::ConnectionMessage,iStr);
                iServerKillRecord = WantedLevel[killerid];
            }

        }else{
            format(iStr,sizeof(iStr),
                "* %s (Id:%d) murdered {A9C4E4}%d players {CCCCCC}in a row and is wanted dead for {A9C4E4}$%s{CCCCCC}.",
                PlayerName(killerid), killerid, WantedLevel[killerid],formatPrice(iKillValue),iWantedLevel);

            SendClientMessageToAllEx(Color::ConnectionMessage,iStr);
        }
    }

    new iPlayerKills = GetWantedLevel(playerid,WantedLevel[playerid]);
    if(iPlayerKills > 0)
    {
        new propertyId = PropertyManager->propertyForSpecialFeature(PoliceFeature),
            endid = propertyId == Property::InvalidId ? Player::InvalidId : Property(propertyId)->ownerId();

        if(Player(endid)->isConnected() && endid != killerid)
        {
            new const awardShare = GetEconomyValue(WantedLevelOwnerShare, iPlayerKills);

            format(iStr,128,"* %s killed %s who had a %d star wanted level. You earned $%s.",PlayerName(killerid),PlayerName(playerid),iPlayerKills,formatPrice(awardShare));
            SendClientMessage(endid,COLOR_GREY,iStr);
            GiveRegulatedMoney(endid, WantedLevelOwnerShare, iPlayerKills);
        }

        new const award = GetEconomyValue(WantedLevelAward, iPlayerKills);

        format(iStr,128,"* %s had a wanted level of %d stars, you earned $%s.",PlayerName(playerid),iPlayerKills,formatPrice(award));
        SendClientMessage(killerid,Color::White,iStr);
        GiveRegulatedMoney(killerid, WantedLevelAward, iPlayerKills);
        WantedLevel[playerid] = 0;
        SetPlayerWantedLevel(playerid,0);
    }
    return 1;
}

WantedLevel__OnPlayerCommandText(playerId) {
    new message[128];
    SendClientMessage(playerId, COLOR_LIGHTBLUE, "Currently wanted people:");

    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
    {
        if(Player(i)->isConnected() == false)
            continue;

        if(GetWantedLevel(i, WantedLevel[i]) > 1)
        {
            format(message, sizeof(message), "%s (Id:%d) - %d stars", PlayerName(i), i, GetWantedLevel(i, WantedLevel[i]));
            SendClientMessage(playerId, Color::Information, message);
        }
    }
    format(message, 128,"* Current Deathmatch Champion: %s with %d kills.", iRecordName, iServerKillRecord);
    SendClientMessage(playerId, Color::Information, message);
}
