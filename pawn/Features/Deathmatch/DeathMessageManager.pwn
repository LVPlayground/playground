// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The fun of killing can be extended by humiliating the killed player some more; with a death
 * message! This message is shown to the killed player, and can be personalized by the killer.
 *
 * @author Max "Cake" Blokker <cake@sa-mp.nl>
 */
class DeathMessageManager {
    // What's the maximum length of a death message?
    const MaximumDeathMessageLength = 128;

    // What's the default duration in seconds for showing a death message?
    const DefaultDeathMessageDuration = 3;

    // Create a death message holder for every player.
    new m_deathMessageText[MAX_PLAYERS][MaximumDeathMessageLength+1];

    // Create a textdraw holder for every player.
    new PlayerText: m_deathMessageTextdraw[MAX_PLAYERS] = {PlayerText: INVALID_TEXT_DRAW, ...};

    // Keep track of the duration the death message has been shown.
    new m_deathMessageDuration[MAX_PLAYERS];

    /**
     * Return the current death message text of a player.
     * 
     * @param playerId Id of the player to get the death message text from.
     */
    public inline getPlayerDeathMessageText(playerId) {
        return (m_deathMessageText[playerId]);
    }

    /**
     * Update the death message for a player with a new message.
     * 
     * @param playerId Id of the player to set the death message text for.
     * @param deathMessageText Text of the death message to set.
     */
    public inline setPlayerDeathMessageText(playerId, deathMessageText[]) {
        format(m_deathMessageText[playerId], sizeof(m_deathMessageText[]), "%s", deathMessageText);
    }

    /**
     * A command is needed to view the current death message and update it if needed. This feature
     * is only available for registered players, since it requires a database entry. Crew members
     * should have the ability to view and change death messages, if the situation requires them to.
     * 
     * @param playerId Id of the player who executed this command.
     * @param subjectId Id of the player who this command should be applied to.
     * @param message The message to set. Optional.
     * @command /p [player] deathmessage [message]?
     * @command /my deathmessage [message]?
     */
    @switch(PlayerCommand, "deathmessage")
    public onPlayerDeathMessageCommand(playerId, subjectId, params[]) {
        if (playerId != subjectId && Player(playerId)->isAdministrator() == false)
            return 0;

        if (Player(playerId)->isLevelTemporary())
            return 0;

        // Only make this feature available to registered players.
        if (Player(subjectId)->isRegistered() == false) {
            if (playerId != subjectId)
                SendClientMessage(playerId, Color::Error, "This player is not registered!");
            else
                SendClientMessage(playerId, Color::Error,
                "You must be registered to change your death message! Register your nickname at www.sa-mp.nl");

            return 1;
        }

        new message[128];
        if (Command->parameterCount(params) == 0) {
            format(message, sizeof(message), "Current death message: {FFFFFF}%s", this->getPlayerDeathMessageText(subjectId));
            SendClientMessage(playerId, Color::Success, message);

            // Inform the user about the correct usage.
            if (playerId != subjectId)
                SendClientMessage(playerId, Color::Information, "Usage: /p [player] deathmessage [message]");
            else
                SendClientMessage(playerId, Color::Information, "Usage: /my deathmessage [message]");

            return 1;
        }

        new offset = Command->startingIndexForParameter(params, 0), deathMessage[MaximumDeathMessageLength + 1];
        if (strlen(params[offset]) > MaximumDeathMessageLength) {
            format(message, sizeof(message), "The death message shouldn't be longer than %d characters!", MaximumDeathMessageLength);
            SendClientMessage(playerId, Color::Error, message);
            return 1;
        }

        format(deathMessage, sizeof(deathMessage), "%s", params[offset]);

        // Check for invalid characters.
        for (new i; i < strlen(deathMessage); i++) {
            if (strcmp(deathMessage[i], "~", true, 1) == 0 || strcmp(deathMessage[i], "'", true, 1) == 0 || strcmp(deathMessage[i], "`", true, 1) == 0) {
                SendClientMessage(playerId, Color::Error, "Invalid, this death message contains special characters.");
                return 1;
            }
        }
        this->setPlayerDeathMessageText(subjectId, deathMessage);

        format(message, sizeof(message), "Death message updated to: {FFFFFF}%s", this->getPlayerDeathMessageText(subjectId));
        SendClientMessage(playerId, Color::Success, message);

        return 1;
    }

    /**
     * Create the player specific textdraw on connect, so we can utilize it at any moment. Also,
     * set the default death message for every player. This default message is overridden in
     * LegacyAccountBridge, if the player has its own custom message.
     *
     * @param playerId Id of the player who connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_deathMessageDuration[playerId] = 0;
        m_deathMessageText[playerId] = "You got smoked!";

        m_deathMessageTextdraw[playerId] = CreatePlayerTextDraw(playerId, 215, 364, "_");
        PlayerTextDrawAlignment(playerId, m_deathMessageTextdraw[playerId], 0);
        PlayerTextDrawBackgroundColor(playerId, m_deathMessageTextdraw[playerId], 0x000000FF);
        PlayerTextDrawFont(playerId, m_deathMessageTextdraw[playerId], 1);
        PlayerTextDrawLetterSize(playerId, m_deathMessageTextdraw[playerId], 0.4, 2.1);
        PlayerTextDrawColor(playerId, m_deathMessageTextdraw[playerId], Color::White);
        PlayerTextDrawSetProportional(playerId, m_deathMessageTextdraw[playerId], 1);
        PlayerTextDrawSetShadow(playerId, m_deathMessageTextdraw[playerId], 2);

        return 1;
    }

    /**
     * Reset some variables and destroy the textdraw on player disconnect.
     *
     * @param playerId Id of the player who disconnected from the server.
     */
    @list(OnPlayerDisconnect)
    public onPlayerDisconnect(playerId) {
        m_deathMessageDuration[playerId] = 0;
        m_deathMessageText[playerId] = "\0";

        PlayerTextDrawDestroy(playerId, m_deathMessageTextdraw[playerId]);

        return 1;
    }

    /**
     * Every time a player dies, we seize the moment to show the killer's death message to the
     * killed player. If no killer is defined, we won't have to show anything. The death message
     * text is put into the player specific textdraw, and then shown to the player.
     *
     * @param playerId Id of the player who died.
     * @param killerId Id of the killer, or INVALID_PLAYER_ID if there was none.
     * @param reason Reason (extended weapon Id) which caused this player to die.
     */
    @list(OnPlayerDeath)
    public onPlayerDeath(playerId, killerId, reason) {
        if (killerId == Player::InvalidId)
            return 0;

        if (Player(playerId)->isConnected() == false || Player(killerId)->isConnected() == false)
            return 0;

        new deathMessage[MaximumDeathMessageLength + 1];
        format(deathMessage, sizeof(deathMessage), "~r~%s~w~: %s", Player(killerId)->nicknameString(),
            this->getPlayerDeathMessageText(killerId));

        PlayerTextDrawHide(playerId, m_deathMessageTextdraw[playerId]);
        PlayerTextDrawSetString(playerId, m_deathMessageTextdraw[playerId], deathMessage);
        PlayerTextDrawShow(playerId, m_deathMessageTextdraw[playerId]);

        m_deathMessageDuration[playerId] = Time->currentTime();

        return 1;
        #pragma unused reason
    }

    /**
     * After a death message is shown, we start tracking its duration. After the default duration
     * of 3 seconds, the textdraw is hidden again.
     * 
     * @param playerId Id of the player of who we calculate the death message duration for.
     */
    @list(SecondTimerPerPlayer)
    public trackDeathMessageDuration(playerId) {
        if (m_deathMessageDuration[playerId] == 0)
            return 0;

        if (Time->currentTime() - m_deathMessageDuration[playerId] > DefaultDeathMessageDuration) {
            PlayerTextDrawHide(playerId, m_deathMessageTextdraw[playerId]);
            m_deathMessageDuration[playerId] = 0;
        }

        return 1;
    }
};
