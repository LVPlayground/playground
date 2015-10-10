// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * There are two types of countdowns in Las Venturas Playground. Firstly, there is the global
 * countdown which will be shown for all players. It will be displayed on their screen as a medium
 * sized box, aligned right below the amount of money they're carrying.
 *
 * Secondly, there are personal countdowns. These are much more prominent as they'll be visible
 * in the center of their screen, with larger characters and a bigger surface area. These are used
 * for many minigames, for example to display the amount of time left before the player can start.
 *
 * There are six public methods which systems using this class will care about.
 *
 * Countdown::startGlobalCountdown(duration)
 * Countdown::stopGlobalCountdown()
 * Countdown::startPlayerCountdown(playerId, duration)
 * Countdown::stopPlayerCountdown(playerId)
 *
 * Countdown::disableGlobalCountdownForPlayer(playerId)
 * Countdown::enableGlobalCountdownForPlayer(playerId)
 *
 * Player-specific countdowns will automatically be stopped after a player disconnects. Upon a new
 * player's connection, we'll make sure to display and running countdowns for them.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Countdown {
    // What is the maximum countdown duration, in seconds?
    public const MaximumDuration = 300;

    // How many seconds should the "GO" text be displayed?
    const SecondsToDisplayGo = 3;

    // A single global text-draw to be shared among all players.
    new Text: m_globalDisplay;

    // At which timestamp should the global countdown stop ticking?
    new m_globalFinishTimestamp;

    // What is the text that's currently being displayed on the global countdown?
    new m_globalTimestampDisplay[8];

    // Should displaying active global countdowns be disabled for a certain player?
    new bool: m_globalDisplayDisabledForPlayer[MAX_PLAYERS];

    /**
     * Initialize the global count-down display for all players. The displayed box is a light-gray
     * rectangle on the right half of the screen, aligned exactly below the amount of cash the
     * player is carrying, one line high to fit nicely above the death list.
     */
    @list(OnGameModeInit)
    public initialize() {
        m_globalDisplay = TextDrawCreate(457.0, 33.0, "_");
        TextDrawAlignment(m_globalDisplay, 2);
        TextDrawColor(m_globalDisplay, Color::White);
        TextDrawBoxColor(m_globalDisplay, Color::LightGrayBackground);
        TextDrawUseBox(m_globalDisplay, 1);
        TextDrawFont(m_globalDisplay, 1);
        TextDrawTextSize(m_globalDisplay, 0.0, 64.0);
        TextDrawLetterSize(m_globalDisplay, 0.51, 2.3);
        TextDrawSetOutline(m_globalDisplay, 1);
    }

    /**
     * Start a new global countdown, which will immediately be displayed on the screens of all
     * players. This function will fail if the duration is longer than the set limit, or if another
     * countdown is already in process.
     *
     * @param duration The duration of the countdown, in seconds.
     * @return boolean Were we able to start the global countdown?
     */
    public bool: startGlobalCountdown(duration) {
        if (duration > Countdown::MaximumDuration || m_globalFinishTimestamp != 0)
            return false;

        m_globalFinishTimestamp = Time->currentTime() + duration;
        m_globalTimestampDisplay[0] = 0;

        new countdownDisplay[8];
        Time->formatRemainingTime(duration, countdownDisplay, sizeof(countdownDisplay));
        TextDrawSetString(m_globalDisplay, countdownDisplay);

        for (new playerId = 0; playerId <= PlayerManager->highestPlayerId(); ++playerId) {
            if (m_globalDisplayDisabledForPlayer[playerId] || !Player(playerId)->isConnected())
                continue;

            TextDrawShowForPlayer(playerId, m_globalDisplay);
        }

        return true;
    }

    /**
     * Immediately stop the global countdown. It will be hidden for all players and the counters
     * will be reset, also making it possible for a new counter to start.
     */
    public stopGlobalCountdown() {
        TextDrawHideForAll(m_globalDisplay);
        m_globalFinishTimestamp = 0;
        m_globalTimestampDisplay[0] = 0;
    }

    /**
     * Enable displaying the global countdown counters for a certain player.
     *
     * @param playerId Id of the player to re-enable display for.
     */
    public enableGlobalCountdownForPlayer(playerId) {
        m_globalDisplayDisabledForPlayer[playerId] = false;
        if (m_globalFinishTimestamp != 0)
            TextDrawShowForPlayer(playerId, m_globalDisplay);
    }

    /**
     * Disable displaying the global countdown displays for a player. This is useful for mini-games
     * and other environments in which the player won't care about the countdown.
     *
     * There is a hack in DeprecatedTimerRuntime::onTwoSecondTimerTick breaking the functionality
     * of this function, until a proper State Manager has been introduced to the gamemode.
     *
     * @param playerId Id of the player to disable the display for.
     */
    public disableGlobalCountdownForPlayer(playerId) {
        if (m_globalDisplayDisabledForPlayer[playerId])
            return;

        m_globalDisplayDisabledForPlayer[playerId] = true;
        if (m_globalFinishTimestamp != 0)
            TextDrawHideForPlayer(playerId, m_globalDisplay);
    }

    /**
     * Upon a player's connecting to the server, we have to initialize their personal display text-
     * draw. Furthermore, if the global timer is running, be sure to show it to them.
     *
     * @param playerId Id of the player who has connected to the server.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        if (m_globalFinishTimestamp != 0)
            TextDrawShowForPlayer(playerId, m_globalDisplay);

        m_globalDisplayDisabledForPlayer[playerId] = false;
    }

    /**
     * Clean up player-specific timer statistics when the player disconnects. 
     *
     * @param playerId Id of the player who is disconnecting from the server.
     */
    @list(OnPlayerDisconnect)
    public onPlayerDisconnect(playerId) {
        m_globalDisplayDisabledForPlayer[playerId] = true;
    }

    /**
     * Process decrementing the value of the global countdown, display of the right amount of time
     * remaining (either seconds or "GO"), and hiding the display when it's finished.
     */
    private processGlobalCountdown() {
        new countdownDisplay[8],
            difference = m_globalFinishTimestamp - Time->currentTime();

        if (difference > 0) {
            // The countdown is still ticking with a positive number of seconds remaining.
            Time->formatRemainingTime(difference, countdownDisplay, sizeof(countdownDisplay));
        } else if ((difference + SecondsToDisplayGo) > 0) {
            // The countdown is finished, but we like to display the "GO" text.
            format(countdownDisplay, sizeof(countdownDisplay), "~y~GO");
        } else {
            // The countdown has finished, so we have to shut it down.
            this->stopGlobalCountdown();
            return;
        }

        // We cache the displayed timestamp so that we don't update all players too often.
        if (m_globalTimestampDisplay[0] == 0 || strcmp(m_globalTimestampDisplay, countdownDisplay) != 0) {
            format(m_globalTimestampDisplay, sizeof(m_globalTimestampDisplay), "%s", countdownDisplay);
            TextDrawSetString(m_globalDisplay, countdownDisplay);
        }
    }

    /**
     * Process all running countdowns. We start with the global counter, and then proceed to the
     * player specific counters if any is in process. This method gets called four times per second,
     * because we'd like it to be time accurate and update whenever necessary.
     */
    @list(HighResolutionTimer)
    public processControl() {
        if (m_globalFinishTimestamp != 0)
            this->processGlobalCountdown();

        /// @todo Implement per-player timer process?
    }

    /**
     * Determine whether a global countdown is being displayed for a certain player. The primary
     * use-case for this is to prevent overlap with other UI elements.
     *
     * @param playerId Id of the player who may be seeing a countdown.
     * @return boolean Is the countdown being displayed on their screen?
     */
    public inline bool: isGlobalCountdownActiveForPlayer(playerId) {
        return (m_globalFinishTimestamp != 0 && m_globalDisplayDisabledForPlayer[playerId] == false);
    }

    /**
     * Determine whether global countdowns are disabled for a certain player.
     *
     * @param playerId Id of the player to verify the status for.
     * @return boolean Is the global countdown disabled for this player?
     */
    public inline bool: isGlobalCountdownDisabledForPlayer(playerId) {
        return (m_globalDisplayDisabledForPlayer[playerId]);
    }
};
