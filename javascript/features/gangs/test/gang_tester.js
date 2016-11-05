// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Utility methods useful for testing the gangs feature. Avoids features from having to dig in to
// the internals of the Gangs feature themselves.
class GangTester {
    // Creates a gang for the |player|, optionally with the other given options. Note that you
    // have to update the MockGangDatabase when beginning to use new tags.
    static async createGang(player, { tag = 'GT', name = 'Gang Tester',
                                      chatEncryptionExpiry = 0 } = {}) {
        const gangs = server.featureManager.loadFeature('gangs');
        const gang = await gangs.manager_.createGangForPlayer(player, tag, name, 'goal');

        if (chatEncryptionExpiry)
            await gangs.manager_.updateChatEncryption(gang, player, chatEncryptionExpiry);

        return gang;
    }

    // Makes the |player| leave the gang that they're currently part of.
    static async leaveGang(player) {
        const gangs = server.featureManager.loadFeature('gangs');
        await gangs.manager_.removePlayerFromGang(player, gangs.getGangForPlayer(player));
    }
}

exports = GangTester;
