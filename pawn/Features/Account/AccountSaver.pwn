// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Accounts will be stored in the database on two occassions: firstly when the player disconnects
 * from the server (to ensure their latest information will be saved), secondly during certain
 * moments in the game itself.
 *
 * To limit the number of queries we execute per second, a timer will run every second that
 * incrementally runs through all online players. When it finds a player that hasn't been saved in
 * the last three minutes (3 * 60 = 180 seconds), it will store the player's data.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class AccountSaver {
    // How many seconds must at least be between saving an account?
    public const AccountSaveIntervalMs = 180 * 1000;

    // When is the last time that we saved a certain player's account?
    new m_playerLastSaveTime[MAX_PLAYERS];

    // What's the player Id we checked in the current run?
    new m_incrementalPlayerId;

    /**
     * Incrementally iterates through the online players when a number of conditionals succeed. A
     * save of the player's data will only be requested when the last save was long enough ago.
     */
    @list(SecondTimer)
    public onSecondTimerTick() {
        if (PlayerManager->connectedPlayerCount() == 0)
            return; // there are no in-game players.

        if (++m_incrementalPlayerId > PlayerManager->highestPlayerId())
            m_incrementalPlayerId = 0;

        if (Player(m_incrementalPlayerId)->isConnected() == false)
            return; // the current player Id is not connected.

        if (Player(m_incrementalPlayerId)->isLoggedIn() == false)
            return; // the current player doesn't have an account.

        if ((Time->highResolution() - m_playerLastSaveTime[m_incrementalPlayerId]) < AccountSaver::AccountSaveIntervalMs)
            return; // the last save wasn't long enough ago.

        // We now have a player who's account information has to be saved. Call the method on the
        // AccountData class, which will take care of the actual action.
        m_playerLastSaveTime[m_incrementalPlayerId] = Time->highResolution();
        AccountData(m_incrementalPlayerId)->save();
    }

    /**
     * We want to save a player's data when they're disconnecting from the server, regardless of
     * when their last save was.
     *
     * @param playerId The player who is about to disconnect.
     */
    @list(OnPlayerDisconnect)
    public onPlayerDisconnect(playerId) {
        if (Player(playerId)->isLoggedIn())
            AccountData(playerId)->save();
    }

    /**
     * We'll re-set the last save time of a player's account when they initially log in to it. This
     * way we ensure that the first save isn't before [log in time] + [save interval time].
     *
     * @param playerId The player who logged in to the server.
     */
    @list(OnPlayerLogin)
    public onPlayerLogin(playerId) {
        m_playerLastSaveTime[playerId] = Time->highResolution();
    }
};
