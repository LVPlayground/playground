// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/*******************************************************************************
*   Las Venturas Playground v2.90 - Regular.pwn. This command file contains    *
*   all of the commands in LVP that are available to the regular players.      *
*******************************************************************************/

// Command: /settings
// Parameters: [setting] [value]
// Creator: Peter
lvp_settings(playerId, params[])
{
    param_shift(paramOption);

    // Do we have any parameters passed on?
    if (!strlen(paramOption)) {
        SendClientMessage(playerId, Color::Information, "Usage: /settings [infomsg/showmsg] [on/off]");
        return 1;
    }

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

    // For automated announcements (i.e. those by Gunther)
    if (!strcmp(paramOption, "infomsg", true, 7)) {
        param_shift(optionToggle);

        new message[128];

        if (Command->parameterCount(optionToggle) == 0) {
            format(message, sizeof(message), "Showing info announcements to you currently is %s{FFFFFF}.",
                (PlayerSettings(playerId)->areAutomatedAnnouncementsDisabled() ?
                    "{DC143C}disabled" :
                    "{33AA33}enabled"));

            SendClientMessage(playerId, Color::Information, message);
            SendClientMessage(playerId, Color::Information, "Usage: /settings infomsg [on/off]" );
            return 1;
        }

        new const bool: enabled = Command->booleanParameter(optionToggle, 0);
        PlayerSettings(playerId)->setAutomatedAnnouncementsDisabled(!enabled);

        format(message, sizeof(message), "Showing info announcements to you is now %s{33AA33}.",
            (PlayerSettings(playerId)->areAutomatedAnnouncementsDisabled() ?
                    "{DC143C}disabled" :
                    "{33AA33}enabled"));

        SendClientMessage(playerId, Color::Success, message);
        return 1;
    }

    return 1;
}
