// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameDescription } from 'features/games/game_description.js';
import { Game } from 'features/games/game.js';

describe('GameCommands', (it, beforeEach) => {
    let commands = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('games');
        commands = feature.commands_;
    });

    it('should be able to create and remove commands on demand', assert => {
        class MyGame extends Game {}

        const description = new GameDescription(MyGame, {
            name: 'My game',
            command: 'mygame',
        });

        assert.isFalse(server.commandManager.hasCommand('mygame'));

        commands.createCommandForGame(description);
        assert.isTrue(server.commandManager.hasCommand('mygame'));

        // An exception is thrown when trying to register a command multiple times.
        assert.throws(() => commands.createCommandForGame(description));

        commands.removeCommandForGame(description);
        assert.isFalse(server.commandManager.hasCommand('mygame'));

        // An exception is thrown when trying to remove an unregistered command.
        assert.throws(() => commands.removeCommandForGame(description));
    });
});
