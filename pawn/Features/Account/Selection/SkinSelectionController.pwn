// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * San Andreas Multiplayer's own class selection is rather dull, and it's sad that players may have
 * to cycle through hundreds of skins before they find the one they actually like. Because of this,
 * we'll skip the default class selection altogether and implement our own.
 *
 * When beginning to select a skin, we'll show a number of main groups in which the skins have been
 * organized. The player can iterate through these groups as they please, and click on a button to
 * actually select a skin within the group. That brings them to the second stage of class selection.
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class SkinSelectionController {
    // In which data file is the skin selection information stored?
    const SkinDataFile = "data/skin_selection.json";

    /**
     * Initializes the skin selection feature by reading all information from the JSON data file and
     * setting up the support classes with it. Some data, such as the objects, can be thrown away
     * immediately, while other data needs to be available for later use.
     */
    public __construct() {
        new Node: dataFile = JSON->parse(SkinDataFile);
        if (dataFile == JSON::InvalidNode) {
            printf("[SkinSelectionController] ERROR: Could not read data file '%s'.", SkinDataFile);
            return;
        }

        new Node: environmentNode = JSON->find(dataFile, "environment");
        if (environmentNode != JSON::InvalidNode)
            SkinSelectionEnvironment->initialize(environmentNode);

        new Node: groupNode = JSON->find(dataFile, "groups"),
            currentGroupIndex = 0;

        while (groupNode != JSON::InvalidNode) {
            SkinSelectionGroup(currentGroupIndex)->initialize(groupNode);
            if (++currentGroupIndex >= NumberOfSkinSelectionGroups)
                break;

            groupNode = JSON->next(groupNode);
        }

        // Close the file to indicate that we're done with it.
        JSON->close();
    }

    /**
     * Starts the skin selector for the given player. We'll mark the player as being in the skin
     * selection state, and then forward this call to the group selector to make selection possible.
     *
     * @param playerId Id of the player who should start selecting a skin.
     */
    public startSelectionForPlayer(playerId) {
        // TODO: Change the player's state.
        SkinGroupSelector->startGroupSelection(playerId);
    }

    // ---------------------------------------------------------------------------------------------

    /**
     * Temporarily introduce the /skinselection command to start the new skin selection flow. This
     * command won't do anything if the player isn't an administrator.
     *
     * @param playerId Id of the player who typed this command.
     * @param params Additional parameters entered by the player.
     */
    @command("skinselection")
    public onSkinSelectionCommand(playerId, params[]) {
        if (Player(playerId)->isAdministrator() == false)
            return;

        this->startSelectionForPlayer(playerId);
        #pragma unused params
    }
};
