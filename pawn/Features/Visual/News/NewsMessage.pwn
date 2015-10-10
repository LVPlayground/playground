// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/// @todo Fix the class-instance-count parsing error in the PreCompiler and remove this hack.
#define NewsMessageCount NewsController::MaximumVisibleNewsMessages

/**
 * The News Message class manages a single news message, and is owned by- and will be controlled
 * through the NewsController class. The Message owns the text-draw used for displaying the message.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class NewsMessage <messageId (NewsMessageCount)> {
    // Id of the text-draw resource owned by this news message.
    new Text: m_messageTextDraw = Text: INVALID_TEXT_DRAW;

    // Time this message was first displayed. Zero indicates that it's hidden.
    new m_displayTime = 0;

    /**
     * Initialize this News Message by creating the necessary text-draw and setting it up if it already hasn't
     * been initialized. It will automatically be invoked during gamemode initialization time, or the first
     * time the show() method is called.
     */
    @list(OnGameModeInit)
    public static initialize() {
        for (new messageId = 0; messageId < NewsMessageCount; ++messageId) {
            m_messageTextDraw[messageId] = TextDrawCreate(150.0, NewsController::VerticalBaselinePosition - messageId * NewsController::VerticalLineSpacing, "_");
            TextDrawBackgroundColor(m_messageTextDraw[messageId], 255);
            TextDrawFont(m_messageTextDraw[messageId], 1);
            TextDrawLetterSize(m_messageTextDraw[messageId], 0.17, 0.79);
            TextDrawColor(m_messageTextDraw[messageId], -1);
            TextDrawSetOutline(m_messageTextDraw[messageId], 1);
            TextDrawSetProportional(m_messageTextDraw[messageId], 1);
        }
    }

    /**
     * Check to see if the news message textdraw is valid and
     * update the text for this news message and display it.
     *
     * @param message The message to display.
     */
    public show(message[]) {
        TextDrawSetString(m_messageTextDraw, message);
        m_displayTime = GetTickCount();
    }

    /**
     * Control the display logic for this message, meaning that we should check whether it has
     * expired and thus should be hidden from view.
     *
     * @param currentTime Current time of the gamemode in ticks.
     */
    public processControl(currentTime) {
         if (m_displayTime == 0 || (currentTime - m_displayTime) < NewsController::MessageDisplayTime * 1000)
            return;

        TextDrawSetString(m_messageTextDraw, "_");
        m_displayTime = 0;
    }

    /**
     * Either hide or show the message for a certain player.
     *
     * @param playerId Id of the player to update this message's visibility for.
     * @param hidden Should the message be hidden?
     */
    public changeVisibilityForPlayer(playerId, bool: hidden) {
        if (hidden)
            TextDrawHideForPlayer(playerId, m_messageTextDraw);
        else
            TextDrawShowForPlayer(playerId, m_messageTextDraw);
    }
}
