// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * List of the available activity types on Las Venturas Playground.
 *
 * DO NOT ADD NEW VALUES TO THIS ENUMERATION WITHOUT ALSO ADDING THEM TO JAVASCRIPT.
 *   //javascript/entities/player_activities.js 
 */
enum PlayerActivityType {
    PlayerActivityNone = 0
};

/**
 * Tracks the activity a player is currently engaged in. The activity can either be implemented in
 * Pawn, or in JavaScript. A synchronization mechanism between the implementations is in place.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class PlayerActivity <playerId (MAX_PLAYERS)> {
    /**
     * The activity the player is currently engaged in.
     */
    new PlayerActivityType: m_activity;

    /**
     * Returns the activity the player is currently engaged in.
     */
    public PlayerActivityType: get() {
        return m_activity;
    }

    /**
     * Updates the activity the player is engaged in to |activity|. The update will be propagated to
     * the JavaScript version of the gamemode as well.
     */
    public set(PlayerActivityType: activity) {
        m_activity = activity;

        // TODO: Propagate the change to JavaScript.
    }

    /**
     * Updates the activity the player is engaged in to |activity|. Will not propagate.
     */
    public silentSet(PlayerActivityType: activity) {
        m_activity = activity;
    }
};
