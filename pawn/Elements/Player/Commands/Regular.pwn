// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
*   Las Venturas Playground v2.90 - Regular.pwn. This command file contains    *
*   all of the commands in LVP that are available to the regular players.      *
*******************************************************************************/

// Command: /ignore
// Parameters: [playerid]
// Creator: Peter
lvp_Ignore( playerid, params[] )
{
    Instrumentation->recordActivity(IgnorePlayerActivity);

    // A new command which enables regulars to ignore other players, for
    // whatever purpose that might be. Administrators are excluded of course.
    if (Player(playerid)->isRegular() == false && Player(playerid)->isAdministrator() == false) {
        SendClientMessage( playerid, COLOR_RED, "You can only use this command as a regular!" );
        return 1;
    }

    if(!strlen(params))
    {
        SendClientMessage( playerid, COLOR_WHITE, "Use: /ignore [playerid/name]");
        return 1;
    }

    new ignoreID = SelectPlayer(params );
    // Proper parameters given to the command?
    if (ignoreID == Player::InvalidId)
    {
        SendClientMessage( playerid, COLOR_WHITE, "Usage: /ignore [playerid/name]" );
        return 1;
    }

    // Do we want to ignore ourselfes (silly people ~.~)
    if (ignoreID == playerid)
    {
        SendClientMessage( playerid, COLOR_RED, "You cannot ignore yourself, silly!" );
        return 1;
    }

    // Now just toggle our magical and powerfull switch.
    g_Ignore[ playerid ][ ignoreID ] = true;

    new szName[ 24 ], szMessage[ 256 ];
    GetPlayerName( ignoreID, szName, 24 );
    format( szMessage, sizeof( szMessage ), "You have successfully ignored %s (ID:%d)!", szName, ignoreID);

    SendClientMessage( playerid, Color::Green, szMessage );
    return 1;
}

// Command: /unignore
// Parameters: [playerid]
// Creator: Peter
lvp_Unignore( playerid, params[] )
{
    // Obviously, people that we ignore must be un-ignored on request. Whatever
    // purpose that might have is unknown to me, why would you ignore someone then ._.
    if (Player(playerid)->isRegular() == false && Player(playerid)->isAdministrator() == false) {
        SendClientMessage( playerid, COLOR_RED, "You can only use this command as a regular!" );
        return 1;
    }

    if(!strlen(params))
    {
        SendClientMessage( playerid, COLOR_WHITE, "Use: /unignore [playerid/name]");
        return 1;
    }

    new ignoreID = SelectPlayer(params );
    // Proper parameters given to the command?
    if (ignoreID == Player::InvalidId)
    {
        SendClientMessage( playerid, COLOR_WHITE, "Usage: /unignore [playerid]" );
        return 1;
    }

    // Check if the player actually is ignored, would be usefull.
    if (g_Ignore[ playerid ][ignoreID] == false)
    {
        SendClientMessage( playerid, COLOR_RED, "You currently haven't ignored this player!" );
        return 1;
    }

    // Aight, now just update the switch again. <3 switches
    g_Ignore[ playerid ][ignoreID] = false;

    new szName[ 24 ], szMessage[ 256 ];
    GetPlayerName(ignoreID, szName, 24 );
    format( szMessage, sizeof( szMessage ), "You now receive messages from %s (ID:%d) again!", szName,ignoreID);

    SendClientMessage( playerid, Color::Green, szMessage );
    return 1;
}

// Command: /ignored
// Parameters: [playerid=0]
// Creator: Peter
lvp_Ignored( playerid, params[] )
{
    // The Ignored command simply returns a list of people this player
    // currently has ignored. Administrators can pass on an extra argument.
    new iCount, iCheckForPlayer = playerid, szName[ 24 ], szMessage[ 256 ],iRequestID ;
    if (Player(playerid)->isAdministrator() && params[0]) {
        param_shift( tempVar );
        iRequestID = SelectPlayer(tempVar);
        if (IsPlayerConnected( iRequestID )) {
            iCheckForPlayer = iRequestID;
        }
        else 
        {
            SendClientMessage(playerid, COLOR_RED, "* That play doesn't exist");
            return 1;
        }
    }

    // Aight, start off with getting the player's name and sending
    // the header of our ignore overview, including the name.
    GetPlayerName( iCheckForPlayer, szName, 24 );
    format( szMessage, sizeof( szMessage ), "Players ignored by '%s':", szName );
    SendClientMessage( playerid, COLOR_ORANGE, szMessage );
    format( szMessage, sizeof( szMessage ), " " );

    // Check it out yo man o/ o/ Loop for all players;
    for (new i = 0; i <= PlayerManager->highestPlayerId(); i++) {
        if (IsPlayerConnected( i ) && g_Ignore[ iCheckForPlayer ][ i ] == true) {
            GetPlayerName( i, szName, 24 ); iCount++;
            format( szMessage, sizeof( szMessage ), "%s%s ", szMessage, szName );
            if (strlen( szMessage ) > 60) {
                SendClientMessage( playerid, COLOR_WHITE, szMessage );
                format( szMessage, sizeof( szMessage ), " " );
            }
        }
    }

    // Do we have a message yet-to-be-send?
    if (strlen( szMessage ) > 4)
    SendClientMessage( playerid, COLOR_WHITE, szMessage );

    // Allright, did we ignore anyone?
    if (iCount == 0)
    {
        SendClientMessage( playerid, COLOR_WHITE, "Noone is being ignored." );
        return 1;
    }

    // Done o/
    return 1;
}


// Command: /settings
// Parameters: [setting] [value]
// Creator: Peter
lvp_settings(playerId, params[])
{
    // Since this version, regular players have the ability to modify a bunch of
    // their own settings. They can decide whether they want to see join/news
    // messages, etcetera. This function provides toggling capabilities.
    if (Player(playerId)->isRegular() == false && Player(playerId)->isAdministrator() == false) {
        SendClientMessage(playerId, Color::Error, "This function is only available for regulars!" );
        return 1;
    }

    param_shift(paramOption);

    // Do we have any parameters passed on?
    if (!strlen(paramOption)) {
        SendClientMessage(playerId, Color::Information, "Usage: /settings [newsmsg/showmsg] [on/off]");
        return 1;
    }

    // First check whether any /settings command has been registered by individual features, as this
    // takes precedence over anything defined in the if/else list that follows. Syntax for any
    // methods listening to this switch is: onSettingsFooCommand(playerId, params[]).
    new result = Annotation::ExpandSwitch<SettingsCommand>(paramOption, playerId, params);
    if (result != -1) // it can still either be 0 or 1, but something handled it.
        return result;

    // For /showmessages
    if (!strcmp(paramOption, "showmsg", true, 7))
    {
        // Get the way how we want to toggle;
        param_shift(optionToggle);

        new message[128];

        if (Command->parameterCount(optionToggle) == 0) {
            format(message, sizeof(message), "Showing showmessages to you currently is %s{FFFFFF}.",
                (!showMessagesEnabled[playerId] ?
                    "{DC143C}disabled" :
                    "{33AA33}enabled"));
            SendClientMessage(playerId, Color::Information, message);
            SendClientMessage(playerId, Color::Information, "Usage: /settings showmsg [on/off]" );
            return 1;
        }

        showMessagesEnabled[playerId] = Command->booleanParameter(optionToggle, 0);

        format(message, sizeof(message), "Showing showmessages to you is now %s{33AA33}.",
            (!showMessagesEnabled[playerId] ?
                "{DC143C}disabled" :
                "{33AA33}enabled"));
        SendClientMessage(playerId, Color::Success, message);

        return 1;
    }

    return 1;
}
