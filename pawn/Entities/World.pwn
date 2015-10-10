// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * The concept of a virtual world, also known as a dimension, can be used to separate players from
 * each other while actually being in the exactly same position anyway. This class exists so we can
 * keep track of which world Ids are being used by which features.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class World {
    // World Id associated with the primary playing world, in which most players reside.
    public const MainWorld = 0;

    // Which World Id will be used for displaying the player in class selection?
    public const WorldForClassSelection = 1;

    // What is the base World for the individual player worlds, i.e. their own private environment?
    // These worlds are where we teleport them when they're in jail or subject to other
    // conditions which requirse them to be individual.
    const BaseWorldForPersonalPlayerEnvironment = 100;

    /**
     * Returns the unique World for a certain player, which can be used for features such as the
     * jail or pause managers.
     *
     * @param playerId Id of the player to get their personal world for.
     * @return integer World which is only available to this player.
     */
    public inline personalWorldForPlayer(playerId) {
        return BaseWorldForPersonalPlayerEnvironment + playerId;
    }

    /**
     * Returns whether or not a world Id is valid for all players, meaning the Id lies within
     * 0 and 100.
     *
     * @param worldId Id of the world which is being checked.
     * @return boolean Is this world valid?
     */
    public bool: isWorldValid(worldId) {
        if (worldId >= World::MainWorld && worldId < BaseWorldForPersonalPlayerEnvironment)
            return true;

        return false;
    }
};
