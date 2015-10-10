// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Controlling the state of a minigame, signing up or dropping a player out of it altogether will
 * be the responsibility of this class. When you are interested in starting any minigame, this is
 * the ONLY valid place to do that.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class MinigameController {
    // The number of minigames which exist on Las Venturas Playground. Because the minigame
    // controller is being included after all the games, we can use this trick.
    public const MinigameCount = @counter(Minigame);

    // What is the current state of each of the minigames available on the server?
    new MinigameState: m_minigameState[MinigameController::MinigameCount] = { IdleMinigameState, ... };

    /**
     * Starts the minigame indicated by the type and Id. We will set up the global state for the
     * players, minigame and environment, whereas the minigame type's controller will do the rest.
     *
     * @param type The type of minigame which should be started.
     * @param minigameId Id of the minigame which should start.
     */
    public startMinigame(MinigameType: type, minigameId) {
        // TODO: Implement this method.
        #pragma unused type, minigameId
    }

    /**
     * Updates the state of a certain minigame to the new value. In the rule, this should only be
     * used by one of the minigame control systems.
     *
     * @param minigameId Id of the minigame which' state should be updated.
     * @param minigameState The new state this minigame should be having.
     */
    public inline setMinigameState(minigameId, MinigameState: minigameState) {
        m_minigameState[minigameId] = minigameState;
    }

    /**
     * Returns the state a minigame currently is in. For most minigames this will return Idle,
     * but it's also perfectly possible for a minigame to be accepting sign-ups or be in progress.
     *
     * @param minigameId Id of the minigame to retrieve the status of.
     * @return MinigameState The state of the given minigame.
     */
    public inline MinigameState: minigameState(minigameId) {
        return m_minigameState[minigameId];
    }
};
