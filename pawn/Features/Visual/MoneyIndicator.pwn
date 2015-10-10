// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * The San Andreas: Multiplayer server will invoke this public method through a timer that we set
 * when a player has a money indicator showing, which we want to hide after a brief period of time.
 *
 * @param playerId Id of the player for whom we may want to hide an indicator.
 * @param wantedStars The number of wanted stars they previously had.
 */
forward HideMoneyIndicator(playerId, wantedStars);
public HideMoneyIndicator(playerId, wantedStars) {
    MoneyIndicator->hideIndicatorForPlayer(playerId, wantedStars);
}

/**
 * When a player receives money or actually spends money, we show the amount in either green (for
 * increases) or red (for decreases) text under their HUD in the top-right of the window.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 * @todo When implementing the money-decrease text-draw, be sure to not display it if any
 *       countdown is active to prevent overlap.
 */
class MoneyIndicator {
    // After how many milliseconds should the money indicator be removed again?
    const HideMoneyIndicatorTime = 2500;

    // The text draw which we'll use for showing the difference.
    new PlayerText: m_textDraw[MAX_PLAYERS] = {PlayerText: INVALID_TEXT_DRAW, ...};

    // We use a timer to hide the textdraw after a certain period of time.
    new m_hideTextdrawTimer[MAX_PLAYERS];

    /**
     * When a player connects to Las Venturas Playground, we'll create the money indicator text
     * draw immediately for them. It's rather unlikely that they won't receive any money.
     *
     * @param playerId Id of the player who connected to LVP.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        m_textDraw[playerId] = CreatePlayerTextDraw(playerId, 502.0, 96.0, "-00000000");
        PlayerTextDrawAlignment(playerId, m_textDraw[playerId], 0);
        PlayerTextDrawBackgroundColor(playerId, m_textDraw[playerId], 0x000000FF);
        PlayerTextDrawFont(playerId, m_textDraw[playerId], 3);
        PlayerTextDrawLetterSize(playerId, m_textDraw[playerId], 0.579999, 2.200000);
        PlayerTextDrawColor(playerId, m_textDraw[playerId], 0xFF000099);
        PlayerTextDrawSetOutline(playerId, m_textDraw[playerId], 1);
        PlayerTextDrawSetProportional(playerId, m_textDraw[playerId], 1);
        PlayerTextDrawSetShadow(playerId, m_textDraw[playerId], 1);

        m_hideTextdrawTimer[playerId] = 0;
    }

    /**
     * The money state manager will report any relevant change so that the visual indicator can be
     * shown as part of the player's hud. We need to format and display the message.
     *
     * @param playerId Id of the player whose money just changed.
     * @param difference The amount of money that has changed for the player.
     */
    public reportMoneyChangeForPlayer(playerId, difference) {
        // TODO: Implement a setting allowing players to disable these updates.

        if (difference > 0)
            return; // only show negative differences.

        new differenceText[16];
        format(differenceText, sizeof(differenceText), "%08d", difference);

        PlayerTextDrawSetString(playerId, m_textDraw[playerId], differenceText);
        PlayerTextDrawShow(playerId, m_textDraw[playerId]);

        if (m_hideTextdrawTimer[playerId] != 0)
            KillTimer(m_hideTextdrawTimer[playerId]);

        m_hideTextdrawTimer[playerId] = SetTimerEx("HideMoneyIndicator", HideMoneyIndicatorTime, 0,
            "ii", playerId, GetPlayerWantedLevel(playerId));
        SetPlayerWantedLevel(playerId, 0);
    }

    /**
     * After the time of the indicator being displayed has expired, we'll want to hide it. Check if
     * the player is still connected to the server, as they may have left in the meantime.
     *
     * @param playerId Id of the player for whom we may want to hide an indicator.
     * @param wantedStars The number of wanted stars they previously had.
     */
    public hideIndicatorForPlayer(playerId, wantedLevel) {
        if (Player(playerId)->isConnected() == false)
            return;

        PlayerTextDrawHide(playerId, m_textDraw[playerId]);
        SetPlayerWantedLevel(playerId, wantedLevel);
    }
};
