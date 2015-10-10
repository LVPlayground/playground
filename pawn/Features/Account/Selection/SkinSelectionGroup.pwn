// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

// How many skin selection groups are available on Las Venturas Playground?
const NumberOfSkinSelectionGroups = 4;

/**
 * Each skin selection group has a number of properties: position of where the actual character
 * has to stand (for which we create an NPC), objects which have to spawn around the character to
 * give it a more unique feel, the camera positions and which skins are included in this class. For
 * choosing the actual skin, we'll need another position and camera positions allowing the player to
 * pick the skin of their choice with a higher granularity.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class SkinSelectionGroup <groupId (NumberOfSkinSelectionGroups)> {
    /**
     * Initializes the data for this group based on what's written in the data file. All nodes will
     * be read and applied immediately. We do assume the skin selection environment to be available,
     * because we may need to create objects for the skin selection.
     *
     * @param groupNode Node in the data file containing this group's information.
     */
    public initialize(Node: groupNode) {
        // TODO: Implement this method.
        #pragma unused groupNode
    }
};
