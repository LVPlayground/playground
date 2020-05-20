// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('HaystackGame', (it, beforeEach) => {
    let gunther = null;
    let russell = null;

    beforeEach(() => {
        server.featureManager.loadFeature('haystack');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
    });

    it('should have registered the game with the server', assert => {
        assert.isTrue(server.commandManager.hasCommand('newhaystack'));
    });

    it('should not reset the players timer when they respawn', async (assert) => {});
});
