// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameDescription } from 'features/games/game_description.js';
import { Game } from 'features/games/game.js';

describe('GameRegistry', (it, beforeEach) => {
    let commands = null;
    let registry = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('games');

        commands = feature.commands_;
        registry = feature.registry_;
    });

    it('should not allow double registering or removing of games', assert => {
        class MyFirstGame extends Game {}

        assert.doesNotThrow(() => {
            registry.registerGame(new GameDescription(MyFirstGame, {
                name: 'My first game',
                goal: 'Goal of the game',
            }));
        });

        assert.throws(() => {
            registry.registerGame(new GameDescription(MyFirstGame, {
                name: 'My first game',
                goal: 'Goal of another game!',
            }));
        });

        assert.doesNotThrow(() => registry.removeGame(MyFirstGame));
        assert.throws(() => registry.removeGame(MyFirstGame));
    });

    it('should create and maintain commands for all of the registered games', assert => {
        class MyFirstGame extends Game {}
        class MySecondGame extends Game {}
        class MyThirdGame extends Game {}

        assert.isFalse(commands.commandsForTesting.has('firstgame'));
        assert.isFalse(commands.commandsForTesting.has('secondgame'));

        registry.registerGame(new GameDescription(MyFirstGame, {
            name: 'My first game',
            goal: 'Make sure that commands are registered',
            command: 'firstgame',
        }));

        assert.isTrue(commands.commandsForTesting.has('firstgame'));
        assert.isFalse(commands.commandsForTesting.has('secondgame'));

        // Cannot re-register either the same game, or another game with the same command.
        assert.throws(() => {
            registry.registerGame(new GameDescription(MyFirstGame, {
                name: 'My first game again',
                goal: 'Introduce a new command',
                command: 'firstgame',
            }));
        });

        assert.throws(() => {
            registry.registerGame(new GameDescription(MySecondGame, {
                name: 'My second game with a wrong command',
                goal: 'Try to use an existing command',
                command: 'firstgame',
            }));
        });

        // Able to register multiple games with commands.
        registry.registerGame(new GameDescription(MySecondGame, {
            name: 'My second game',
            goal: 'Commands can be registered',
            command: 'secondgame',
        }));

        assert.isTrue(commands.commandsForTesting.has('firstgame'));
        assert.isTrue(commands.commandsForTesting.has('secondgame'));

        // Able to register games that do not have a command of their own.
        registry.registerGame(new GameDescription(MyThirdGame, {
            name: 'My third, command-less game',
            goal: 'Another game without a command',
        }));

        // Able to remove games and their associated commands again.
        registry.removeGame(MyFirstGame);

        assert.isFalse(commands.commandsForTesting.has('firstgame'));
        assert.isTrue(commands.commandsForTesting.has('secondgame'));

        registry.removeGame(MySecondGame);
        registry.removeGame(MyThirdGame);

        assert.isFalse(commands.commandsForTesting.has('firstgame'));
        assert.isFalse(commands.commandsForTesting.has('secondgame'));
    });

    it('tells the game manager to stop games of a particular type when needed', assert => {
        class MyFirstGame extends Game {}

        let stopCalls = 0;

        const fakeManager = new class {
            stopAllActiveGames(description) {
                assert.strictEqual(description.gameConstructor, MyFirstGame);
                assert.equal(description.name, 'My first game');

                ++stopCalls;
            }
        };
        
        // Override the actual manager to capture the methods that would be called.
        registry.manager_ = fakeManager;

        registry.registerGame(new GameDescription(MyFirstGame, {
            name: 'My first game',
            goal: 'Make sure that games can be stopped.',
            command: 'firstgame',
        }));

        assert.equal(stopCalls, 0);
        registry.removeGame(MyFirstGame);
        assert.equal(stopCalls, 1);
    });
});
