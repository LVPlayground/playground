// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameActivity } from 'features/games/game_activity.js';
import { GameDescription } from 'features/games/game_description.js';
import { GameRegistration } from 'features/games/game_registration.js';
import { Game } from 'features/games/game.js';
import { Setting } from 'entities/setting.js';

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

    it('should not allow players to customize games without settings', async (assert) => {
        class BubbleGame extends Game {}

        const description = new GameDescription(BubbleGame, {
            name: 'Bubble',
            goal: 'Have the registration time expire',
            command: 'bubblegame',
        });

        // Create the command, give Gunther enough money to participate, and fix the timeout.
        commands.createCommandForGame(description);

        // Have Gunther execute the custom command, even though no settings are available.
        gunther.respondToDialog({ response: 0 /* Dismiss */ });

        assert.isTrue(await gunther.issueCommand('/bubblegame custom'));
        assert.equal(gunther.messages.length, 0);

        assert.includes(gunther.lastDialog, 'does not have any customization options available');
    });

    it('should enable players to customize game settings', async (assert) => {
        class BubbleGame extends Game {}

        const description = new GameDescription(BubbleGame, {
            name: 'Bubble',
            goal: 'Have the registration time expire',
            command: 'bubblegame',

            settingsValidator: (setting, value) => true,
            settings: [
                new Setting('bubble', 'enum', ['easy', 'normal', 'hard'], 'normal', 'Enumeration'),
                new Setting('bubble', 'number', Setting.TYPE_NUMBER, 30, 'Numeric value'),
                new Setting('bubble', 'boolean', Setting.TYPE_BOOLEAN, false, 'Boolean value'),
                new Setting('bubble', 'string', Setting.TYPE_STRING, 'text', 'Textual value'),
            ],
        });

        let settings = null;

        // (1) Gunther is able to cancel out of starting a new game.
        gunther.respondToDialog({ response: 0 /* Dismiss */ });

        settings = await commands.determineSettings(description, /* custom= */ true, gunther);
        assert.isNull(settings);

        // (2) Have Gunther change one of the enumeration values. These will be shown as a list.
        gunther.respondToDialog({ listitem: 2 /* Enumeration */ }).then(
            () => gunther.respondToDialog({ listitem: 2 /* hard */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* Start the game! */ }));

        settings = await commands.determineSettings(description, /* custom= */ true, gunther);
        assert.strictEqual(settings.get('bubble/enum'), 'hard');

        // (3) Have Gunther change one of the numeric values. This will be shown as a question.
        gunther.respondToDialog({ listitem: 3 /* Numeric value */ }).then(
            () => gunther.respondToDialog({ inputtext: 'banana' /* string, invalid */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Acknowledge */ })).then(
            () => gunther.respondToDialog({ inputtext: '1234' })).then(
            () => gunther.respondToDialog({ listitem: 0 /* Start the game! */ }));
    
        settings = await commands.determineSettings(description, /* custom= */ true, gunther);
        assert.strictEqual(settings.get('bubble/number'), 1234);

        // (4) Have Gunther change one of the boolean values. This will be a list.
        gunther.respondToDialog({ listitem: 4 /* Boolean value */ }).then(
            () => gunther.respondToDialog({ listitem: 0 /* enabled */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* Start the game! */ }));

        settings = await commands.determineSettings(description, /* custom= */ true, gunther);
        assert.strictEqual(settings.get('bubble/boolean'), true);

        // (5) Have Gunther change one of the textual values. This will be shown as a question.
        gunther.respondToDialog({ listitem: 5 /* Textual value */ }).then(
            () => gunther.respondToDialog({ inputtext: 'banana' /* string */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* Start the game! */ }));
    
        settings = await commands.determineSettings(description, /* custom= */ true, gunther);
        assert.strictEqual(settings.get('bubble/string'), 'banana');

        // (6) Create a flow where they change all of the settings in one go.
        gunther.respondToDialog({ listitem: 2 /* Numeric value */ }).then(
            () => gunther.respondToDialog({ listitem: 2 /* hard */ })).then(
            () => gunther.respondToDialog({ listitem: 3 /* Numeric value */ })).then(
            () => gunther.respondToDialog({ inputtext: '1234' })).then(
            () => gunther.respondToDialog({ listitem: 4 /* Boolean value */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* enabled */ })).then(
            () => gunther.respondToDialog({ listitem: 5 /* Textual value */ })).then(
            () => gunther.respondToDialog({ inputtext: 'banana' /* string */ })).then(
            () => gunther.respondToDialog({ listitem: 0 /* Start the game! */ }));
        
        settings = await commands.determineSettings(description, /* custom= */ true, gunther);
        assert.strictEqual(settings.get('bubble/enum'), 'hard');
        assert.strictEqual(settings.get('bubble/number'), 1234);
        assert.strictEqual(settings.get('bubble/boolean'), true);
        assert.strictEqual(settings.get('bubble/string'), 'banana');
    });

    it('should only customize game settings if validation succeeds', async (assert) => {
        class BubbleGame extends Game {}

        const description = new GameDescription(BubbleGame, {
            name: 'Bubble',
            goal: 'Have the registration time expire',
            command: 'bubblegame',

            settingsValidator: (setting, value) => {
                switch (setting) {
                    case 'bubble/number':
                        return value === 50;
                    case 'bubble/string':
                        return value === 'apple';
                    default:
                        throw new Error(`Invalid setting spotted: ${setting}`);
                }
            },
            settings: [
                new Setting('bubble', 'number', Setting.TYPE_NUMBER, 30, 'Numeric value'),
                new Setting('bubble', 'string', Setting.TYPE_STRING, 'text', 'Textual value'),
            ],
        });

        // (1) Ensure validation of numeric values.
        gunther.respondToDialog({ listitem: 2 /* Numeric value */ }).then(
            () => gunther.respondToDialog({ inputtext: '40' /* rejected */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Acknowledge */ })).then(
            () => gunther.respondToDialog({ inputtext: '50' })).then(
            () => gunther.respondToDialog({ listitem: 0 /* Start the game! */ }));
    
        settings = await commands.determineSettings(description, /* custom= */ true, gunther);
        assert.strictEqual(settings.get('bubble/number'), 50);

        // (2) Ensure validation of textual values.
        gunther.respondToDialog({ listitem: 3 /* Textual value */ }).then(
            () => gunther.respondToDialog({ inputtext: 'banana' /* string */ })).then(
            () => gunther.respondToDialog({ response: 1 /* Acknowledge */ })).then(
            () => gunther.respondToDialog({ inputtext: 'apple' })).then(
            () => gunther.respondToDialog({ listitem: 0 /* Start the game! */ }));
    
        settings = await commands.determineSettings(description, /* custom= */ true, gunther);
        assert.strictEqual(settings.get('bubble/string'), 'apple');
    });

    it('should not allow custom and default registration at the same time', async (assert) => {
        class BubbleGame extends Game {}

        const description = new GameDescription(BubbleGame, {
            name: (settings) => {
                const difficulty = settings.get('bubble/enum') ?? 'normal';
                return difficulty[0].toUpperCase() + difficulty.substring(1) + ' Bubble';
            },
            goal: 'Have the registration time expire',
            command: 'bubblegame',

            settingsValidator: (setting, value) => true,
            settings: [
                new Setting('bubble', 'enum', ['easy', 'normal', 'hard'], 'normal', 'Enumeration'),
            ]
        });

        // Connect an extra player. Holsje can help out for this one.
        server.playerManager.onPlayerConnect({ playerid: 3, name: 'Holsje' });

        const holsje = server.playerManager.getById(/* Holsje= */ 3);
        assert.isNotNull(holsje);

        // Create the command, give the players enough money to participate.
        commands.createCommandForGame(description);

        finance.givePlayerCash(gunther, 5000);
        finance.givePlayerCash(russell, 5000);
        finance.givePlayerCash(lucy, 5000);
        finance.givePlayerCash(holsje, 5000);

        // (1) Have Gunther start a normal game.
        assert.isTrue(await gunther.issueCommand('/bubblegame'));
        
        const guntherActivity = manager.getPlayerActivity(gunther);

        assert.isNotNull(guntherActivity);
        assert.equal(guntherActivity.getActivityName(), 'Normal Bubble');
        assert.equal(guntherActivity.getActivityState(), GameActivity.kStateRegistered);

        // (2) Have Russell start a custom game.
        russell.respondToDialog({ listitem: 2 /* Difficulty */ }).then(
            () => russell.respondToDialog({ listitem: 2 /* hard */ })).then(
            () => russell.respondToDialog({ listitem: 0 /* Start the game! */ }));

        assert.isTrue(await russell.issueCommand('/bubblegame custom'));

        const russellActivity = manager.getPlayerActivity(russell);

        assert.isNotNull(russellActivity);
        assert.equal(russellActivity.getActivityName(), 'Hard Bubble');
        assert.equal(russellActivity.getActivityState(), GameActivity.kStateRegistered);

        assert.notStrictEqual(guntherActivity, russellActivity);

        // (3) Have Lucy join the normal game, you know, to get started.
        assert.isTrue(await lucy.issueCommand('/bubblegame'));

        const lucyActivity = manager.getPlayerActivity(lucy);

        assert.isNotNull(lucyActivity);
        assert.equal(lucyActivity.getActivityName(), 'Normal Bubble');
        assert.equal(lucyActivity.getActivityState(), GameActivity.kStateRegistered);

        assert.strictEqual(lucyActivity, guntherActivity);

        assert.equal(holsje.messages.length, 2);
        assert.includes(holsje.messages[1], '/bubblegame 2');

        // (4) Have Holsje try to join, but unfortunately they make a typo in the id first..
        assert.isTrue(await holsje.issueCommand('/bubblegame 20'));
        assert.equal(holsje.messages.length, 3);
        assert.includes(holsje.messages[2], `isn't taking registrations anymore`);

        // (5) And have Holsje join the hard game together with Russell
        assert.isTrue(await holsje.issueCommand('/bubblegame 2'));

        const holsjeActivity = manager.getPlayerActivity(holsje);

        assert.isNotNull(holsjeActivity);
        assert.equal(holsjeActivity.getActivityName(), 'Hard Bubble');
        assert.equal(holsjeActivity.getActivityState(), GameActivity.kStateRegistered);

        assert.strictEqual(holsjeActivity, russellActivity);
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
