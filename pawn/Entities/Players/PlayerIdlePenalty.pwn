// Copyright 2006-2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Players occasionally spend hours in-game without actually being active, which counts towards
 * their online time for no reason. This class determines whether they've been idle, and tracks the
 * penalty that has to be applied to their online time at the end of their session.
 *
 * In short, the first 15 minutes of idle time will be counted, after which the remaining idle time
 * will *not* be counted towards their online time.
 */
class PlayerIdlePenalty {
    // Allowed amount of time that a player may be idle without applying a penalty.
    const AllowedIdleTime = 15 * 60;

    // Tracks the latest known position and rotation of each player.
    new Float: m_currentPosition[MAX_PLAYERS][4];

    // Tracks the current time spend in the same position of this player.
    new m_currentPositionTime[MAX_PLAYERS];

    // Tracks the penalty time that has been applied to a player.
    new m_penaltyTime[MAX_PLAYERS];

    /**
     * Resets the statistics for the |playerId| because the player has just connected. Makes sure
     * that we don't apply data from the former player to their account.
     *
     * @param playerId Id of the player that connected.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect(playerId) {
        for (new i = 0; i < 4; ++i)
            m_currentPosition[playerId][0] = 0.0;

        m_currentPositionTime[playerId] = 0;
        m_penaltyTime[playerId] = 0;
    }

    /**
     * Resets the idle time for |player|. This only has to be done manually in case of an incoming
     * event, such as them chatting or issuing a command.
     *
     * @param playerId Player to reset the idle time for.
     */
    public resetCurrentIdleTime(playerId) {
        m_currentPositionTime[playerId] = 0;
    }

    /**
     * Called every ten seconds. Iterates through all online players, gets their current positions
     * and determines whether they're idle. Idle times of over 15 minutes will be considered as
     * penalty time, which will not count towards a player's online time.
     */
    @list(TenSecondTimer)
    public onTenSecondTimerTick() {
        new Float: position[3];
        new Float: rotation;

        for (new playerId = 0; playerId < PlayerManager->highestPlayerId(); ++playerId) {
            if (!Player(playerId)->isConnected())
                continue;

            GetPlayerPos(playerId, position[0], position[1], position[2]);
            GetPlayerFacingAngle(playerId, rotation);

            new const bool: isIdle = m_currentPosition[playerId][0] == position[0] &&
                                     m_currentPosition[playerId][1] == position[1] &&
                                     m_currentPosition[playerId][2] == position[2] &&
                                     m_currentPosition[playerId][3] == rotation;

            if (isIdle) {
                m_currentPositionTime[playerId] += 10 /* ten second timer */;
            } else {
                if (m_currentPositionTime[playerId] >= AllowedIdleTime)
                    m_penaltyTime[playerId] += m_currentPositionTime[playerId] - AllowedIdleTime;

                m_currentPositionTime[playerId] = 0;
            }

            m_currentPosition[playerId][0] = position[0];
            m_currentPosition[playerId][1] = position[1];
            m_currentPosition[playerId][2] = position[2];

            m_currentPosition[playerId][3] = rotation;
        }
    }

    /**
     * Returns whether the |playerId| is currently considered idle, following the same methodology
     * used to determine whether to penalize their online time.
     *
     * @param playerId Id of the player who is considered to be idle.
     */
    public bool: isIdle(playerId) {
        return m_currentPositionTime[playerId] >= AllowedIdleTime;
    }

    /**
     * Returns the total time penalty that should be applied to the |playerId|. This will include
     * the most recent idle time if they are still idle.
     *
     * @param playerId Id of the player to get the time penalty for.
     */
    public getPlayerPenaltyTime(playerId) {
        new timePenalty = m_penaltyTime[playerId];

        if (m_currentPositionTime[playerId] >= AllowedIdleTime)
            timePenalty += m_currentPositionTime[playerId] - AllowedIdleTime;

        return timePenalty;
    }
}
