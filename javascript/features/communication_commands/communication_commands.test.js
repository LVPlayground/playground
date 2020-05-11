// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('CommunicationCommands', (it, beforeEach) => {
    let gunther = null;

    beforeEach(() => {
        server.featureManager.loadFeature('communication_commands');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
    });

    
});
