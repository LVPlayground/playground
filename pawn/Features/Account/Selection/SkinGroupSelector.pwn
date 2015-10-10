// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * The skin group selector is the first stage of skin selection, which allows players to select the
 * group their skin is part of. Examples of groups include "public services", "high rollers", and so
 * on. Each group will be represented using a non player character.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class SkinGroupSelector {
    /**
     * Initializes the group selection dialog for this player. We'll move them to the right world
     * and position and make sure they can start to select the group of their choice.
     *
     * @param playerId Id of the player who has to go to group selection.
     */
    public startGroupSelection(playerId) {
        SkinSelectionEnvironment->setUpForPlayer(playerId);

        // TODO: Implement this method.
    }
};