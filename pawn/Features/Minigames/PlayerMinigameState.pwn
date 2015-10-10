// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Keeping track of whether a player is currently engaged in a minigame, and if so, which minigame,
 * used to be a very hard job due to the broad range of different systems in the gamemode. We've
 * unified all of that in a single player minigame state class.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class PlayerMinigameState <playerId (MAX_PLAYERS)> {
    // The current state of this player's minigame activity.
    new MinigameState: m_state;

    // Id of the minigame in which this player is participating or has signed up for.
    new m_minigameId;

    /**
     * Reset the player's state to being idle in regards to minigame activities. If we don't do this
     * properly, then the player may end up being unable to participate in any minigame.
     */
    @list(OnPlayerConnect)
    public onPlayerConnect() {
        m_state = IdleMinigameState;
    }

    /**
     * Updates the current state of this player in regards to their minigame activities. Only the
     * minigame control classes should be changing this status.
     *
     * @param minigameId Id of the minigame which the player is involved in.
     * @param minigameState Their new state in scope of this minigame.
     */
    public setMinigameState(minigameId, MinigameState: minigameState) {
        m_minigameId = minigameId;
        m_state = minigameState;
    }

    /**
     *
     *
     */
    public resetMinigameState() {

    }

    /**
     * Returns the player's current minigame state, which can be used to determine whether the player
     * is signed up or participating in a minigame.
     *
     * @return boolean Whether the player is involved in any minigame.
     */
    public inline MinigameState: minigameState() {
        return m_state;
    }

    /**
     *
     *
     *
     */
    public inline minigameId() {
        return m_minigameId;
    }
};
