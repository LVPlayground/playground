// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The News Controller is in charge of displaying news messages on player's screens. They will be
 * shown as text-draw objects on the left side of the screen, with a maximum number of messages
 * visible at any given time.
 *
 * News Messages include announcements from minigames, zone changes and errors, which often are easy
 * to miss in the normal chat. By using text-draws, they will be given extra attention.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class NewsController {
    // How many news messages can be displayed on a player's screen at any given time?
    public const MaximumVisibleNewsMessages = 4;

    // What is the baseline position to position the news messages above?
    public const VerticalBaselinePosition = 414.0;

    // What is the vertical spacing, in pixels, between the lines?
    public const VerticalLineSpacing = 8.0;

    // What is the display time, in seconds, after which a message will be removed?
    public const MessageDisplayTime = 20.0;

    // Index of the message which is next in line to be used for message displaying.
    new m_currentMessageIndex = 0;

    // Are news messages currently hidden from view for a certain player?
    new bool: m_messagesDisabledForPlayer[MAX_PLAYERS];

    // Disable the newsmessage for the specified player. This is the trigger to flip it!
    new bool: m_disableMessageForPlayer[MAX_PLAYERS];

    /**
     * Display a news message for all connected players. The display will be cycled through the
     * available message slots, resetting to the first one once the last has been reached.
     *
     * @param message The message that should be shown.
     */
    public show(message[]) {
        NewsMessage(m_currentMessageIndex)->show(message);
        if (++m_currentMessageIndex >= NewsController::MaximumVisibleNewsMessages)
            m_currentMessageIndex = 0;
    }

    /**
     * Determine whether news messages should be hidden for a certain player, which can occur when
     * they're playing a minigame.
     *
     * @param playerId Id of the player to check the conditions against.
     * @return boolean Should news messages be hidden?
     */
    private bool: shouldDisableMessages(playerId) {
        if (IsPlayerInMinigame(playerId))
            return true;

        if (IsInterfaceBlockedByJavaScript(playerId))
            return true;

        if (m_disableMessageForPlayer[playerId])
            return true;

        return false;
    }

    /**
     * Run through all news messages and have them determine whether they should be hidden. Then
     * iterate through the connected players to see if we need to hide all messages for them.
     *
     * This method runs every two seconds through an invocation list.
     */
    @list(TwoSecondTimer)
    public processControl() {
        new currentTime = GetTickCount();
        for (new index = 0; index < NewsController::MaximumVisibleNewsMessages; ++index)
            NewsMessage(index)->processControl(currentTime);

        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
            if (Player(playerId)->isConnected() == false)
                continue;

            // Exceptions are added for players who are in virtual worlds, taking part in minigames
            // or simply have the feature disabled using the player /settings command.
            new bool: disableMessages = this->shouldDisableMessages(playerId);
            if (m_messagesDisabledForPlayer[playerId] == disableMessages)
                continue;

            for (new index = 0; index < NewsController::MaximumVisibleNewsMessages; ++index)
                NewsMessage(index) -> changeVisibilityForPlayer(playerId, disableMessages);

            m_messagesDisabledForPlayer[playerId] = disableMessages;
        }
    }

    /**
     * When a player joins the server make sure to remove the settings of the previous player
     * and re-instate the default settings for this new player, which is to keep the news messages
     * enabled and showing.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        if (Player(playerId)->isNonPlayerCharacter())
            return;

        for (new index = 0; index < NewsController::MaximumVisibleNewsMessages; ++index){
            NewsMessage(index)->changeVisibilityForPlayer(playerId, false);
        }

        m_messagesDisabledForPlayer[playerId] = false;
    }

    /**
     * Regulars can disable messages with the /settings newsmsg-commands. The functionality
     * underneath implements the use of the specified param.
     */
    @switch(SettingsCommand, "newsmsg")
    public onSettingsNewsmsgCommand(playerId, params[]) {
        new message[128];

        if (Command->parameterCount(params) == 0) {
            format(message, sizeof(message), "Showing newsmessages to you currently is %s{FFFFFF}.",
                (m_messagesDisabledForPlayer[playerId] ?
                    "{DC143C}disabled" :
                    "{33AA33}enabled"));
            SendClientMessage(playerId, Color::Information, message);
            SendClientMessage(playerId, Color::Information, "Usage: /settings newsmsg [on/off]" );
            return 1;
        }

        m_disableMessageForPlayer[playerId] = !Command->booleanParameter(params, 0);

        format(message, sizeof(message), "Showing newsmessages to you is now %s{33AA33}.",
            (m_disableMessageForPlayer[playerId] ?
                "{DC143C}disabled" :
                "{33AA33}enabled"));
        SendClientMessage(playerId, Color::Success, message);

        return 1;
    }
}

forward OnDisplayNewsMessage(message[]);
public OnDisplayNewsMessage(message[]) {
    NewsController->show(message);
}

