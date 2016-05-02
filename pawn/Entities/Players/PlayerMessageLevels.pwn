// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Crew members will receive plenty of messages from all sorts of events; minigame-signups, PMs,
 * phone calls, admin notices and more. A manager is needed to sort certain topics of messages, and
 * divide those over so called "message levels". By adjusting these settings, a crew member can
 * receive the perfect amount of information he/she desires.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class MessageLevelsManager {
    // Keep track of every player's message level.
    new m_playerMessageLevel[MAX_PLAYERS];

    /**
     * By default every player only receives messages from the world they're currently staying in.
     * This function make this setting adjustable to either receive messages from the current world,
     * or all available worlds.
     * 
     * @param playerId Id of the player who executed this command.
     * @param subjectId Id of the player who this command should be applied to. Ignored.
     * @param params Any further text that the player passed to the command.
     * @command /my allchat [on/off]
     */
    @switch(PlayerCommand, "allchat")
    public onPlayerAllChatCommand(playerId, subjectId, params[]) {
        if (playerId != subjectId || Player(playerId)->isAdministrator() == false)
            return 0;

        new message[128];
        if (Command->parameterCount(params) != 1) {
            format(message, sizeof(message), "Currently receiving messages from {FFFFFF}%s.",
                (PlayerSettings(playerId)->isAllVirtualWorldChatEnabled() ? "all {33AA33}worlds" : "this {33AA33}world"));
            SendClientMessage(playerId, Color::Success, message);

            // Inform the user about the correct usage.
            SendClientMessage(playerId, Color::Information, "Usage: /my allchat [on/off]");
            return 1;
        }

        new bool: enableAllChat = Command->booleanParameter(params, 0);
        PlayerSettings(playerId)->setAllVirtualWorldChatEnabled(enableAllChat);

        format(message, sizeof(message), "Setting changed to receive messages from {FFFFFF}%s.",
            (PlayerSettings(playerId)->isAllVirtualWorldChatEnabled() ? "all {33AA33}worlds" : "this {33AA33}world"));
        SendClientMessage(playerId, Color::Success, message);

        return 1;
    }

    /**
     * By dividing certain player based chat message into levels, admins can chose which messages
     * they'd like to receive and which should stay hidden.
     * 
     * @param playerId Id of the player who executed this command.
     * @param subjectId Id of the player who this command should be applied to. Ignored.
     * @param params Any further text that the player passed to the command.
     * @command /my messagelevel [0-2]
     */
    @switch(PlayerCommand, "messagelevel")
    public onPlayerMessageLevelCommand(playerId, subjectId, params[]) {
        if (playerId != subjectId || Player(playerId)->isAdministrator() == false)
            return 0;

        new message[128], messageLevel = Command->integerParameter(params, 0);
        if (Command->parameterCount(params) != 1 || messageLevel < 0 || messageLevel > 2) {
            format(message, sizeof(message), "Current messagelevel: {FFFFFF}%d (%s). Usage: /my messagelevel [0-2]",
                m_playerMessageLevel[playerId],
                (m_playerMessageLevel[playerId] == 0 ? "all admin messages" :
                m_playerMessageLevel[playerId] == 1 ? "all admin messages, PMs and phone calls" :
                "all admin message, PMs, phone calls and gang chat"));
            SendClientMessage(playerId, Color::Success, message);

            // Inform the user about the message levels.
            SendClientMessage(playerId, Color::Information, " Level 0: All admin messages (default).");
            SendClientMessage(playerId, Color::Information, " Level 1: Level 0 + PMs and phone calls.");
            SendClientMessage(playerId, Color::Information, " Level 2: Level 1 + Gang chat.");
            return 1;
        }

        CallRemoteFunction("OnMessageLevelChange", "ii", playerId, messageLevel);
        m_playerMessageLevel[playerId] = messageLevel;

        format(message, sizeof(message), "Message level changed to: {FFFFFF}%d (%s).", messageLevel,
            (messageLevel == 0 ? "all admin messages" :
            messageLevel == 1 ? "all admin messages, PMs and phone calls" :
            "all admin message, PMs, phone calls and gang chat"));
        SendClientMessage(playerId, Color::Success, message);

        return 1;
    }

    /**
     * Reset the message level variable for each connecting player.
     *
     * @param playerId Id of the player who connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_playerMessageLevel[playerId] = 0;
    }

    /**
     * Setter to set the crew member's message level.
     *
     * @param playerId Id of the player to set the message level for.
     * @param messageLevel Level of receiving messages.
     */
    public setPlayerMessageLevel(playerId, messageLevel) {
        CallRemoteFunction("OnMessageLevelChange", "ii", playerId, messageLevel);
        m_playerMessageLevel[playerId] = messageLevel;
    }

    /**
     * Getter to retrieve the crew member's message level.
     *
     * @param playerId Id of the player to set the message level for.
     * @return integer Stating the crew member's message level.
     */
    public inline getPlayerMessageLevel(playerId) {
        return (m_playerMessageLevel[playerId]);
    }
};

forward OnMessageLevelChange(playerid, messagelevel);
public OnMessageLevelChange(playerid, messagelevel) {}
