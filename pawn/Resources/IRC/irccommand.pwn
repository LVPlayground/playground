// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

IRCCommand()
{
    new filename[20] = "irccmd.txt";
    if(!fexist(filename))
    {
        return 1;
    }

    new line[256];
    new File:gFile = fopen(filename, io_read);

    if (gFile == File:0) return 1;

    fread(gFile, line, 256);
    fclose(gFile);

    fremove(filename);

    // Due to a bug that crashed the server, we're going to add this little check
    for(new i = 0;i<strlen(line);i++)
    { // I know it's not optimized but tbh, it's not super important for this
        if(line[i] == 37) line[i] = 176; // Convert % to ° (better than nothing)
    }

    return _: RemoteCommand->onCommand(line);
}

RunDeprecatedIrcCommand(line[]) {
    new string[256];
    new cmd[256];
    new idx;

    cmd = strtok(line, idx);

    // Command: FixNpcs
    // Reconnects the NPCs.
    if(!strcmp(cmd, "fixnpcs", true))
    {
        ServiceController->resetServices();
        AddEcho("Done.");
        return 1;
    }

    if(strcmp(cmd,"givetempadmin",true) == 0)
    {
        new tmp[256], szName [256];
        tmp = strtok(line, idx);
        if(!tmp[0]) return AddEcho("Correct Usage: !givetempadmin <playerid>");

        format(szName, 256, "%s", tmp);
        tmp = strtok(line, idx);

        new pid = strval(tmp);
        if(!Player(pid)->isConnected())
        {
            format(string,sizeof(string),"[notconnected] %d",pid);
            AddEcho(string);
            return 1;
        }
        if(Player(pid)->isAdministrator() == true)
        {
            AddEcho("[error] That player is an admin already!");
        }

        new str[256];
        format(str,256,"%s (IRC) has granted temp. admin rights to %s (Id:%d).", szName, PlayerName (pid), pid);
        Admin(Player::InvalidId, str);

        Player(pid)->setIsVip(true);
        Player(pid)->setLevel(AdministratorLevel);

        ColorManager->storeExistingPlayerCustomColor(pid);
        ColorManager->setPlayerCustomColor(pid, Color::AdministratorColor);

#if Feature::DisableVehicleManager == 0
        VehicleAccessManager->synchronizePlayerVehicleAccess(pid);
#endif  // Feature::DisableVehicleManager == 0

        tempLevel[pid] = 2;
        format(UserTemped[pid], sizeof(UserTemped[]), "%s", szName);
        format(str,256,"%s is now a temp administrator.",PlayerName(pid));
        AddEcho(str); 
        SendClientMessage(pid,Color::Green,"You have been granted administrator rights.");
        return 1;
    }

    if(strcmp(cmd,"taketempadmin",true) == 0)
    {
        new tmp[256], szName [256];
        tmp = strtok(line, idx);
        if(!tmp[0]) return AddEcho("Correct Usage: !taketempadmin <playerid>");

        format(szName, 256, "%s", tmp);
        tmp = strtok(line, idx);

        new pid = strval(tmp);
        if(!Player(pid)->isConnected())
        {
            format(string,sizeof(string),"[notconnected] %d",pid);
            AddEcho(string);
            return 1;
        }
        new str[256];
        format(str,256,"%s (IRC) has taken admin rights from %s (Id:%d).", szName, PlayerName (pid), pid);
        Admin(Player::InvalidId, str);

        Player(pid)->setLevel(PlayerLevel);
        ColorManager->restorePreviousPlayerCustomColor(pid);

#if Feature::DisableVehicleManager == 0
        VehicleAccessManager->synchronizePlayerVehicleAccess(pid);
#endif  // Feature::DisableVehicleManager == 0

        tempLevel[pid] = 0;
        UserTemped [pid] = "";
        format(str,256,"%s is no longer an administrator.",PlayerName(pid));
        AddEcho(str); 
        return 1;
    }

    if(strcmp(cmd, "say", true) == 0)
    {
        new tmp[256];
        tmp = strtok(line, idx);

        if (strlen(tmp) == 0) {
            return 0;
        }

        new szSayName[ 64 ]; format( szSayName, 64, "%s", tmp );
        new szMessage[256];

        format( szMessage, 256, "%s", line[ 5 + strlen(szSayName) ] );
        if (strlen( szMessage ) < 2) {
            AddEcho( "[error] The message needs to be longer then 2 characters." );
            return 0;
        }

        format( string, sizeof( string ), "* Admin (%s): %s", szSayName, szMessage);
        SendClientMessageToAll( 0x2587CEAA, string );

        format(string, sizeof(string), "[say] %s %s", szSayName, szMessage);
        AddEcho(string);

        return 1;
    }

    if(strcmp(cmd, "ban", true) == 0)
    {
        new tmp[256];
        tmp = strtok(line, idx);

        if (strlen(tmp) == 0) {
            return 0;
        }

        new szBannedBy[256];
        format(szBannedBy, 256, "%s", tmp);
        new iLen = strlen( tmp );

        tmp = strtok(line, idx);

        new iPlayerID = 0;
        if (strlen(tmp) == 0) {
            return 0;
        }

        iPlayerID = strval(tmp);
        if (!Player(iPlayerID)->isConnected()) {
            AddEcho( "[error] The requested PlayerID is not connected." );
            return 0;
        }

        // Reason
        new iLength = 6 + iLen + strlen( tmp );
        format( tmp, sizeof( tmp ), "%s", line[ iLength ] );

        if (strlen(tmp) < 3) {
            AddEcho( "[error] The ban-reason needs to be longer then 5 characters." );
            return 0;
        }

        new name[24];
        GetPlayerName(iPlayerID, name, 24);

        new reason[128];
        format(reason, sizeof(reason), "Banned by %s on IRC: %s", szBannedBy, tmp);

        Player(iPlayerID)->ban(reason);

        format( string, 256, "%s (Id:%d) has been banned by %s (IRC): %s", name, iPlayerID, szBannedBy, tmp );
        Admin(Player::InvalidId, string);

        return 1;
    }

    if(strcmp(cmd, "kick", true) == 0)
    {
        new tmp[256];
        tmp = strtok(line, idx);

        if (strlen(tmp) == 0) {
            return 0;
        }

        new szBannedBy[256];
        format(szBannedBy, 256, "%s", tmp);
        new iLen = strlen( tmp );

        tmp = strtok(line, idx);

        new iPlayerID = 0;
        if (strlen(tmp) == 0) {
            return 0;
        }

        iPlayerID = strval(tmp);
        if (!Player(iPlayerID)->isConnected()) {
            AddEcho( "[error] The requested PlayerID is not connected." );
            return 0;
        }

        // Reason
        new iLength = 7 + iLen + strlen( tmp );
        format( tmp, sizeof( tmp ), "%s", line[ iLength ] );

        if (strlen(tmp) < 3) {
            AddEcho( "[error] The kick-reason needs to be longer then 5 characters." );
            return 0;
        }

        new name[24];
        GetPlayerName(iPlayerID, name, 24);

        new reason[128];
        format(reason, sizeof(reason), "Kicked by %s on IRC: %s", szBannedBy, tmp);

        Player(iPlayerID)->kick(reason);

        format( string, 256, "%s (Id:%d) has been kicked by %s (IRC): %s", name, iPlayerID, szBannedBy, tmp );
        Admin(Player::InvalidId, string);

        return 1;
    }

    if( strcmp( cmd, "announce", true ) == 0 )
    {
        // Syntax: announce name message
        new tmp[256];
        tmp = strtok(line, idx);

        new sendText[256];
        sendText = right(line,(strlen(line)-strlen(tmp)-10));

        SendClientMessageToAll(Color::Red, "-------------------");
        SendClientMessageToAll(COLOR_YELLOW, sendText );
        SendClientMessageToAll(Color::Red, "-------------------");

        format(string,sizeof(string),"Announce by %s (IRC): %s", tmp, sendText);

        Admin(Player::InvalidId, string);

        return 1;

    }

    if (strcmp( cmd, "jail", true ) == 0) {
        // Felle: updated the jail command, entirely based on !mute
        // syntax sent from Nuwani is: jail ircnick playerid minutes
        new tmp[256];
        tmp = strtok(line, idx);

        if(!tmp[0]) {
            AddEcho("[error] Usage: !jail [playerId] [duration]");
            return 1;
        }

        new jailedBy[32];
        format(jailedBy, sizeof(jailedBy), "%s", tmp);

        tmp = strtok(line, idx);

        // get ID
        new pid = strval(tmp);

        if (Player(pid)->isConnected() == false || Player(pid)->isNonPlayerCharacter()) {
            format(string, sizeof(string), "[notconnected] %d", pid);
            AddEcho(string);
            return 1;
        }

        tmp = strtok(line, idx);

        // *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *** *

        // get the minutes. if no minutes selected (-1) - the ID is muted until someone unmutes them.
        new duration = JailController::DefaultPunishmentDuration,
            bool: wasJailed = JailController->isPlayerJailed(pid);

        if (strlen(tmp) >= 1) // has a duration been supplied by the admin on IRC?
            duration = strval(tmp);

        if (duration < 0 || duration > /** an arbitrarily chosen maximum: one day **/ 1440)
            duration = JailController::DefaultPunishmentDuration;

        JailController->jailPlayer(pid, duration);

        // Distribute a message to the offender about this.
        format(string, sizeof(string), "%s (IRC) has jailed you for %s%d minutes.", jailedBy, wasJailed ? "another " : "", duration);
        SendClientMessage(pid, Color::Error, string);

        // Distribute a message to all in-game staff about this.
        format(string, sizeof(string), "%s (IRC) jailed %s (Id:%d) for %d minutes.", jailedBy, Player(pid)->nicknameString(), pid, duration);
        Admin(Player::InvalidId, string);

        return 1;
    }

    if(strcmp(cmd, "unjail", true) == 0)
    {
        new tmp[256];
        tmp = strtok(line, idx);

        new unjailedBy[32];
        format(unjailedBy, sizeof(unjailedBy), "%s", tmp);
        tmp = strtok(line, idx); // move to the playerId argument

        if(!tmp[0]) {
            AddEcho("[error] Usage: !unjail [playerId]");
            return 1;
        }

        new pid = strval(tmp);
        if(Player(pid)->isConnected() == false || Player(pid)->isNonPlayerCharacter()){
            format(string,sizeof(string),"[notconnected] %d",pid);
            AddEcho(string);
            return 1;
        }

        // Maybe the player is not in jail at all?
        if (JailController->isPlayerJailed(pid) == false) {
            AddEcho("[error] This player is not in jail.");
            return 1;
        }

        JailController->unjailPlayer(pid);

        // Distribute a message to the offender about this.
        format(string, sizeof(string), "%s (IRC) has released you from jail, effective immediately.", unjailedBy);
        SendClientMessage(pid, Color::Error, string);

        // Distribute a message to all in-game staff about this.
        format(string, sizeof(string), "%s (IRC) released %s (Id:%d) from jail.", unjailedBy, Player(pid)->nicknameString(), pid);
        Admin(Player::InvalidId, string);

        return 1;
    }

    if(strcmp(cmd, "getid", true) == 0){
        new tmp[256];
        tmp = strtok(line, idx);

        if(!tmp[0]) 
        {
            // AdminError("Usage: !getid [playerName]");
            return 1;
        }

        new pid = GetPlayerId(tmp);
        if(pid != Player::InvalidId)
        {
            format(string, sizeof(string), "[getid] %s %d", tmp, pid);
        }
        else{
            format(string, sizeof(string), "[getidnone] %s", tmp);
        }

        AddEcho(string);
        return 1;
    }

    if(strcmp(cmd, "msg", true) == 0)
    {
        new tmp[256];
        tmp = strtok(line, idx);

        new sendText[256];
        sendText = right(line,(strlen(line)-strlen(tmp)-5));

        format(string, sizeof(string), "%s: %s", tmp, sendText);
        SendClientMessageToAllEx(0xFFFFFFAA, string);

        format(string, sizeof(string), "[noidmsg] %s %s", tmp, sendText);
        AddEcho(string);

        return 1;
    }

    if( strcmp( cmd, "adminm", true ) == 0 )
    {
        // Syntax: adminm name message
        new tmp[256];
        tmp = strtok(line, idx);

        new sendText[256];
        sendText = right(line,(strlen(line)-strlen(tmp)-8));

        format(string,sizeof(string),"* Message from %s (IRC): %s", tmp, sendText);

        for (new i = 0; i <= PlayerManager->highestPlayerId(); i++)
        {
            if( IsPlayerConnected( i ) && Player(i)->isAdministrator())
                SendClientMessage(i, COLOR_YELLOW, string);
        }

        format(string,sizeof(string),"[adminmsg] %s 255 %s", tmp, sendText);
        AddEcho(string);

        return 1;
    }

    return 0;
}