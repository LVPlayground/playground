// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Display a message just above the class selection button box telling the user that they have to
 * identify before they're allowed to spawn. Otherwise players will be able to click on the button,
 * while no action would be committed, which would be strange.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class NeedToIdentifyForSpawnMessage <playerId (MAX_PLAYERS)> {
    // Showing a warning message to the player about their need to identify needs a text draw.
    new PlayerText: m_messageTextDraw;

    // Show the message for the player unless it already is being shown.
    public show() {
        if (m_messageTextDraw != PlayerText: INVALID_TEXT_DRAW)
            return;

        m_messageTextDraw = CreatePlayerTextDraw(playerId, 248.0, 383.0, "~r~Please identify before spawning!");
        PlayerTextDrawBackgroundColor(playerId, m_messageTextDraw, 255);
        PlayerTextDrawFont(playerId, m_messageTextDraw, 1);
        PlayerTextDrawLetterSize(playerId, m_messageTextDraw, 0.257, 1.3);
        PlayerTextDrawColor(playerId, m_messageTextDraw, -1);
        PlayerTextDrawSetOutline(playerId, m_messageTextDraw, 1);
        PlayerTextDrawSetProportional(playerId, m_messageTextDraw, 1);

        PlayerTextDrawShow(playerId, m_messageTextDraw);
    }

    // Hide (and destroy) the message for the player again.
    public hide() {
        if (m_messageTextDraw == PlayerText: INVALID_TEXT_DRAW)
            return;

        PlayerTextDrawDestroy(playerId, m_messageTextDraw);
        m_messageTextDraw = PlayerText: INVALID_TEXT_DRAW;
    }

    // Reset the message text draw variable to its initial state, namely an invalid draw.
    public reset() {
        m_messageTextDraw = PlayerText: INVALID_TEXT_DRAW;
    }
};
