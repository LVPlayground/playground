// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameDescription } from 'features/games/game_description.js';
import { GameRegistration } from 'features/games/game_registration.js';
import { Game } from 'features/games/game.js';

describe('GameCommands', (it, beforeEach) => {
    let commands = null;
    let finance = null;
    let gunther = null;
    let lucy = null;
    let manager = null;
    let russell = null;
    let settings = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('games');

        commands = feature.commands_;
        manager = feature.manager_;

        finance = server.featureManager.loadFeature('finance');
        settings = server.featureManager.loadFeature('settings');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        russell = server.playerManager.getById(/* Russell= */ 1);
        lucy = server.playerManager.getById(/* Lucy= */ 2);
    });

    it('should be able to create and remove commands on demand', assert => {
        class MyGame extends Game {}

        const description = new GameDescription(MyGame, {
            name: 'My game',
            goal: 'Try out the command',
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
            goal: 'Have multiple people join it',
            command: 'bubblegame',
            price: 5000,
        });

        // Configure the registration to expire after 25 seconds.
        settings.setValue('games/registration_expiration_sec', 25);

        // Creates the `/bubblegame` command on the server, which players can use.
        commands.createCommandForGame(description);

        // Give Gunther enough money to be able to play in the game.
        finance.givePlayerCash(gunther, 5000);

        // (1) Have Gunther use the `/bubblegame` command to start a new game.
        assert.isTrue(await gunther.issueCommand('/bubblegame'));
        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[0], Message.format(Message.GAME_REGISTRATION_JOINED, 'Bubble'));
        assert.equal(
            gunther.messages[1], Message.format(Message.GAME_REGISTRATION_CREATED, 25));

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

        // (4) There should be an error if Russell doesn't have enough money.
        assert.isTrue(await russell.issueCommand('/bubblegame'));
        assert.equal(russell.messages.length, 2);
        assert.equal(
            russell.messages[1],
            Message.format(Message.GAME_REGISTRATION_NOT_ENOUGH_MONEY, 5000, 'Bubble'));

        finance.givePlayerCash(russell, 12500);
            
        // (5) Russell should be able to join the created game.
        assert.isTrue(await russell.issueCommand('/bubblegame'));
        assert.equal(russell.messages.length, 3);
        assert.equal(
            russell.messages[2], Message.format(Message.GAME_REGISTRATION_JOINED, 'Bubble'));
        
        assert.isNotNull(manager.getPlayerActivity(russell));
        assert.equal(manager.getPlayerActivity(russell).getActivityName(), 'Bubble');

        // (6) Verify that the participation fee has been taken from both participants.
        assert.equal(finance.getPlayerCash(gunther), 0);
        assert.equal(finance.getPlayerCash(russell), 7500);
    });

    it('should warn players when there are not enough players for a game', async (assert) => {
        class BubbleGame extends Game {}

        const description = new GameDescription(BubbleGame, {
            name: 'Bubble',
            goal: 'Make sure that we can count players',
            command: 'bubblegame',
            minimumPlayers: 5,
            maximumPlayers: 8,
            price: 5000,
        });

        // Creates the `/bubblegame` command on the server, which players can use.
        commands.createCommandForGame(description);

        // Give Gunther enough money to be able to play in the game.
        finance.givePlayerCash(gunther, 5000);

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
            goal: 'Avoid people from having to wait!',
            command: 'bubblegame',
            minimumPlayers: 1,
            maximumPlayers: 8,
        });

        // Creates the `/bubblegame` command on the server, which players can use.
        commands.createCommandForGame(description);

        // Give Gunther enough money to be able to play in the game.
        finance.givePlayerCash(gunther, 5000);

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

    it('should automatically try to start a game when the registration expires', async (assert) => {
        class BubbleGame extends Game {}

        const description = new GameDescription(BubbleGame, {
            name: 'Bubble',
            goal: 'Have the registration time expire',
            command: 'bubblegame',
            minimumPlayers: 2,
            maximumPlayers: 4,
            price: 1000,
        });

        // Create the command, give Gunther enough money to participate, and fix the timeout.
        commands.createCommandForGame(description);
        finance.givePlayerCash(gunther, 5000);
        settings.setValue('games/registration_expiration_sec', 25);

        // Have Gunther start the Bubble game, but have it fail because of lack of participation.
        assert.isTrue(await gunther.issueCommand('/bubblegame'));
        assert.equal(gunther.messages.length, 2);

        assert.isNotNull(manager.getPlayerActivity(gunther));
        assert.equal(finance.getPlayerCash(gunther), 4000);

        await server.clock.advance(25 * 1000);  // advance the time past expiration

        assert.equal(finance.getPlayerCash(gunther), 5000);  // refunded
        assert.equal(gunther.messages.length, 3);
        assert.equal(
            gunther.messages[2],
            Message.format(Message.GAME_REGISTRATION_NOT_ENOUGH_REGISTRATIONS, 'Bubble'));
        
        assert.isNull(manager.getPlayerActivity(gunther));

        // Have Gunther and Russell both sign up for the Bubble game, which means that it will
        // start automatically after the registration expiration delay.
        assert.isTrue(await gunther.issueCommand('/bubblegame'));
        assert.equal(gunther.messages.length, 5);

        finance.givePlayerCash(russell, 5000);

        assert.isTrue(await russell.issueCommand('/bubblegame'));
        assert.equal(russell.messages.length, 3);

        await server.clock.advance(25 * 1000);  // advance the time past expiration

        assert.isNotNull(manager.getPlayerActivity(gunther));
        assert.isNotNull(manager.getPlayerActivity(russell));
    });

    it('enables players to cancel their registration with the /leave command', async (assert) => {
        class BubbleGame extends Game {}

        const description = new GameDescription(BubbleGame, {
            name: 'Bubble',
            goal: 'Players must be able to leave',
            command: 'bubblegame',
            price: 1000,
        });

        // Create the command, give Gunther enough money to participate.
        commands.createCommandForGame(description);
        finance.givePlayerCash(gunther, 5000);

        // Have Gunther start the Bubble game...
        assert.isTrue(await gunther.issueCommand('/bubblegame'));
        assert.equal(gunther.messages.length, 2);

        assert.isNotNull(manager.getPlayerActivity(gunther));
        assert.equal(finance.getPlayerCash(gunther), 4000);

        // Have Gunther type the `/leave` command because they changed their mind.
        assert.isTrue(await gunther.issueCommand('/leave'));
        assert.equal(gunther.messages.length, 3);
        assert.equal(gunther.messages[2], Message.format(Message.GAME_REGISTRATION_LEFT, 'Bubble'));

        assert.isNull(manager.getPlayerActivity(gunther));
        assert.equal(finance.getPlayerCash(gunther), 5000);
    });
});
