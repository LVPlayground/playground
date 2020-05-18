// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameDescription } from 'features/games/game_description.js';
import { GameRegistration } from 'features/games/game_registration.js';
import { Game } from 'features/games/game.js';

import { kDurationSeconds } from 'features/games/game_registration.js';

describe('GameCommands', (it, beforeEach) => {
    let commands = null;
    let gunther = null;
    let lucy = null;
    let manager = null;
    let russell = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('games');

        commands = feature.commands_;
        manager = feature.manager_;

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        lucy = server.playerManager.getById(/* Lucy= */ 2);
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

    it('should be able to create new games, and join existing ones', async (assert) => {
        assert.isNull(manager.getPlayerActivity(gunther));

        class BubbleGame extends Game {}

        const description = new GameDescription(BubbleGame, {
            name: 'Bubble',
            command: 'bubblegame',
            price: 5000,
        });

        // Creates the `/bubblegame` command on the server, which players can use.
        commands.createCommandForGame(description);

        // (1) Have Gunther use the `/bubblegame` command to start a new game.
        assert.isTrue(await gunther.issueCommand('/bubblegame'));
        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[0], Message.format(Message.GAME_REGISTRATION_JOINED, 'Bubble'));
        assert.equal(
            gunther.messages[1],
            Message.format(Message.GAME_REGISTRATION_CREATED, kDurationSeconds));

        assert.isNotNull(manager.getPlayerActivity(gunther));
        assert.equal(manager.getPlayerActivity(gunther).getActivityName(), 'Bubble');

        // (2) Verify that other players have received an announcement.
        assert.equal(russell.messages.length, 1);
        assert.equal(
            russell.messages[0],
            Message.format(Message.GAME_REGISTRATION_ANNOUNCEMENT, 'Bubble', 'bubblegame', 5000));

        // (3) There should be an error if Gunther tries to join the game again.
        assert.isTrue(await gunther.issueCommand('/bubblegame'));
        assert.equal(gunther.messages.length, 3);
        assert.equal(
            gunther.messages[2],
            Message.format(Message.GAME_REGISTRATION_ALREADY_REGISTERED, 'Bubble'));

        // (4) Russell should be able to join the created game.
        assert.isTrue(await russell.issueCommand('/bubblegame'));
        assert.equal(russell.messages.length, 2);
        assert.equal(
            russell.messages[1], Message.format(Message.GAME_REGISTRATION_JOINED, 'Bubble'));
        
        assert.isNotNull(manager.getPlayerActivity(russell));
        assert.equal(manager.getPlayerActivity(russell).getActivityName(), 'Bubble');
    });

    it('should warn players when there are not enough players for a game', async (assert) => {
        class BubbleGame extends Game {}

        const description = new GameDescription(BubbleGame, {
            name: 'Bubble',
            command: 'bubblegame',
            minimumPlayers: 5,
            maximumPlayers: 8,
            price: 5000,
        });

        // Creates the `/bubblegame` command on the server, which players can use.
        commands.createCommandForGame(description);

        assert.isTrue(await gunther.issueCommand('/bubblegame'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.GAME_REGISTRATION_NOT_ENOUGH_PLAYERS, 'Bubble', 5, 3));
        
        assert.isNull(manager.getPlayerActivity(gunther));
    });

    it('should automatically start games when no other players are available', async (assert) => {
        class BubbleGame extends Game {}

        const description = new GameDescription(BubbleGame, {
            name: 'Bubble',
            command: 'bubblegame',
            minimumPlayers: 1,
            maximumPlayers: 8,
        });

        // Creates the `/bubblegame` command on the server, which players can use.
        commands.createCommandForGame(description);

        // Mark |russell| and |lucy| as bots, so that there's only one available player.
        russell.setIsNonPlayerCharacterForTesting(true);
        lucy.setIsNonPlayerCharacterForTesting(true);

        assert.equal(GameRegistration.getTheoreticalNumberOfParticipants(manager), 1);

        // Now have |gunther| execute the `/bubblegame` command, it should start automatically.
        assert.isTrue(await gunther.issueCommand('/bubblegame'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0], Message.format(Message.GAME_REGISTRATION_STARTED, 'Bubble'));
    });
});
