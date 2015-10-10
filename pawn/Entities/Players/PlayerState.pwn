// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The current state of a player can be represented in one of the following enums. Only one can be
 * active at any time, and releasing the state will move it to NormalPlayerState.
 */
enum PlayerStateType {
    // Default state, no player with this Id has been connected.
    DisconnectedPlayerState,

    // Default state for any connected player -- full functionality available.
    NormalPlayerState,

    // The player is currently in jail, functionality is limited.
    JailedPlayerState,

    // If the player is currently driving around in a map zone, we allow limited functionality.
    MapZonePlayerState,

    // When the player is participating in a FightClub fight, functionality is limited.
    FightClubPlayerState,

    // Vehicle modders should have limited functionality.
    VehicleTuningPlayerState,

    // During a race certain functionalities should be limited.
    RacingPlayerState,

    // During loading of a save-info slot, functionality should be limited.
    SaveLoadingPlayerState
};

/**
 * Maintains which state is currently active for the given player and provides functionality to help
 * identify what the player is able to do.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class PlayerState <playerId (MAX_PLAYERS)> {
    // What is the current state of this player?
    new PlayerStateType: m_currentState;

    /**
     * Returns whether this player is subject to limited functionality. This is the case when we
     * consider them as being "semi-connected", for example when they're in jail.
     *
     * @return boolean Do we limit the amount of functionality available to this player?
     */
    public inline bool: hasLimitedFunctionality() {
        return (m_currentState != NormalPlayerState);
    }

    /**
     * Returns the current state which applies to this player. This could be used to create clearer
     * error messages for when they run in limited functionality mode.
     *
     * @return PlayerStateType The active state for this player.
     */
    public inline PlayerStateType: currentState() {
        return (m_currentState);
    }

    /**
     * Updates the player's current state to the given value.
     *
     * @param newState The new state which should be active for this player.
     */
    public inline updateState(PlayerStateType: newState) {
        m_currentState = newState;
    }

    /**
     * Releases the current state and resets the player's current state back to NormalPlayerState.
     */
    public inline releaseState() {
        m_currentState = NormalPlayerState;
    }
};
