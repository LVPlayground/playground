// Copyright 2006-2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

/**
 * Gunther is our hero. We all love him. He tirelessly walks around on the Pirate Ship to keep an
 * eye out on all the bad things players may want to try. He's an NPC we employ to do this!
 *
 * @author Russell Krupke <russell@sa-mp.nl>
 */
class Gunther {
    // What is the handler Id we'll have associated for Mr Gunther?
    public const GuntherHandlerId = @counter(NpcHandler);

    // What's the label Gunther walks around with, giving off his wise advice?
    new Text3D: m_announcementLabel = Text3D: INVALID_3DTEXT_ID;

    /**
     * Initializes Gunther by connecting him to Las Venturas Playground. We'll also create the text
     * label he'll carry around, which shares his important message with the world.
     */
    public initialize() {
        NPCManager->request("Gunther", "lvpship", Gunther::GuntherHandlerId);
        if (m_announcementLabel == Text3D: INVALID_3DTEXT_ID) {
            m_announcementLabel = Create3DTextLabel("THE SHIP IS A PEACEZONE!\nShooting is not allowed here.",
                Color::Red, 0.0, 0.0, 0.0, 100.0, 0, false);
        }
    }

    /**
     * Invoked when Gunther spawns in the world. We make sure that he'll wear the right skin for his
     * job and attach his words of wisdom to his persona.
     *
     * @param featureReference Instance reference for bots within a feature. We don't use this.
     * @param playerId Id of the player who's embodying Gunther.
     */
    @switch(OnNpcSpawn, Gunther::GuntherHandlerId)
    public onGuntherSpawn(featureReference, playerId) {
        SetPlayerVirtualWorld(playerId, World::MainWorld);
        Attach3DTextLabelToPlayer(m_announcementLabel, playerId, 0.0, 0.0, 0.5);
        SetPlayerSkin(playerId, 217);
        // TODO: Set the bot's color.

        #pragma unused featureReference
    }
};
