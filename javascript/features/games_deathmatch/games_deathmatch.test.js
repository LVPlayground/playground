// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathmatchGame } from 'features/games_deathmatch/deathmatch_game.js';

describe('GamesDeathmatch', (it, beforeEach) => {
    let feature = null;
    let gunther = null;

    beforeEach(() => {
        feature = server.featureManager.loadFeature('games_deathmatch');
        gunther = server.playerManager.getById(/* Gunther= */ 0);
    });

    it('automatically re-registers games when the Games feature reloads', async (assert) => {
        class BubbleGame extends DeathmatchGame {}

        assert.isFalse(server.commandManager.hasCommand('bubble'));

        feature.registerGame(BubbleGame, {
            name: 'Bubble Fighting Game',
            goal: 'Fight each other with bubbles',
            command: 'bubble',
        });

        assert.isTrue(server.commandManager.hasCommand('bubble'));

        await server.featureManager.liveReload('games');

        assert.isTrue(server.commandManager.hasCommand('bubble'));
    });
});
