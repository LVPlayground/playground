// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the GPLv2 license, a copy of which can
// be found in the LICENSE file.

/**
 * Players have hundreds of skins they can choose from, and we need a convenient way of presenting
 * them. San Andreas: Multiplayer supplies a class selection for this purpose, and in here we'll
 * load all available classes and store basic information about them.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class ClassManager {
    // Name of the data file that contains the valid player classes.
    const ClassDataFile = "data/player_classes.json";

    // What is the maximum value class Ids can have?
    const MaximumClassId = 300;

    // Store the Skin Ids which corrospond to created class Ids. These aren't per se in order.
    new m_skinForClassId[MaximumClassId];

    /**
     * Initialize the list of classes which players can use to spawn. These are all stored in the
     * player_classes.json file, which contains an array of the skins players can use to spawn. As
     * such, the following is an example of a valid player_classes.json file:
     *
     * [
     *   0, # CJ
     *   1, # Truth
     * ]
     */
    public __construct() {
        new Node: classRoot = JSON->parse(ClassDataFile);
        if (classRoot == JSON::InvalidNode || JSON->getType(classRoot) != JSONArray) {
            printf("[ClassManager] ERROR: Unable to read the list of valid player classes.");
            return;
        }

        new classCount = 0, skinId;
        for (new Node: classNode = JSON->firstChild(classRoot); classNode != JSON::InvalidNode; classNode = JSON->next(classNode)) {
            if (classCount++ >= MaximumClassId)
                break;

            if (JSON->getType(classNode) != JSONInteger)
                continue;

            JSON->readInteger(classNode, skinId);
            m_skinForClassId[AddPlayerClass(skinId, 0.0, 0.0, 0.0, 0.0, 0, 0, 0, 0, 0, 0)] = skinId;
        }

        JSON->close();
    }

    /**
     * A helper function to determine whether a certain skin is available in the class selection.
     * Normally, we'll want to disable skins from usage if this is not the case.
     *
     * @param skinId Id of the skin to check validity of.
     * @return boolean Is the skin available in class selection?
     */
    public bool: isSkinAvailableForClassSelection(skinId) {
        for (new index = 0; index < MaximumClassId; ++index) {
            if (m_skinForClassId[index] == skinId)
                return true;
        }

        return false;
    }
};
