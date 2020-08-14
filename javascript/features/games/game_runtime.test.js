// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { EnvironmentSettings } from 'features/games/environment_settings.js';
import { GameActivity } from 'features/games/game_activity.js';
import { GameBase } from 'features/games/game_base.js';
import { GameDescription } from 'features/games/game_description.js';
import { GameRuntime } from 'features/games/game_runtime.js';
import { Game } from 'features/games/game.js';
import { Vector } from 'base/vector.js';

import { runGameLoop } from 'features/games/game_test_helpers.js';

describe('GameRuntime', (it, beforeEach) => {
    let finance = null;
    let gunther = null;
    let manager = null;
    let nuwani = null;
    let russell = null;
    let spectate = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('games');

        manager = feature.manager_;

        finance = server.featureManager.loadFeature('finance');
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        nuwani = server.featureManager.loadFeature('nuwani');
        russell = server.playerManager.getById(/* Russell= */ 1);
        spectate = server.featureManager.loadFeature('spectate');
    });

    // Default settings, an empty map, to be made available to games.
    const kDefaultSettings = new Map();

    // Prepares the game run in |description|, but does not yet call `run()` and/or `finalize()`,
    // which is left as an exercise to the test.
    async function prepareGame(description, players) {
        const virtualWorld = Math.floor(Math.random() * 10000);

        const runtime =
            new GameRuntime(manager, description, kDefaultSettings, () => finance, () => nuwani,
                            () => spectate, virtualWorld);
        
        await runtime.initialize();
        for (const player of players)
            await runtime.addPlayer(player);
        
        return runtime;
    }

    it('should serialize and later on restore participant states', async (assert) => {
        const description = new GameDescription(Game, { name: 'Bubble', goal: '' });
        const runtime = new GameRuntime(
            manager, description, kDefaultSettings, () => finance, () => nuwani, () => spectate);

        await runtime.initialize();

        await runtime.addPlayer(gunther);
        assert.isTrue(gunther.hasBeenSerializedForTesting);

        const game = runtime.run();

        await runtime.removePlayer(gunther);
        assert.isFalse(gunther.hasBeenSerializedForTesting);

        await Promise.all([ game, runGameLoop() ]);
    });

    it('should call the Game events in order', async (assert) => {
        let spawnCount = 0;
        let userData = { counter: 0 };

        const events = [];
        const description = new GameDescription(class extends Game {
            async onInitialized(settings, userData) {
                events.push('onInitialized');
                userData.counter++;
            }
            async onPlayerAdded(player) { events.push('onPlayerAdded'); }
            async onPlayerSpawned(player, countdown) {
                events.push('onPlayerSpawned');
                if (++spawnCount === 3)
                    await this.stop();
            }
            async onTick() { events.push('onTick'); }
            async onPlayerRemoved(player) { events.push('onPlayerRemoved'); }
            async onFinished() { events.push('onFinished'); }

        }, { name: 'Bubble', goal: 'Capture the events' }, userData);

        const runtime = await prepareGame(description, [ gunther, russell ]);
        const game = runtime.run();

        await runGameLoop();

        dispatchEvent('playerspawn', { playerid: gunther.id });

        await runGameLoop();
        await runtime.finalize();

        assert.deepEqual(events, [
            'onInitialized',
            'onPlayerAdded',
            'onPlayerAdded',
            'onPlayerSpawned',
            'onPlayerSpawned',
            'onTick',
            'onTick',
            'onTick',
            'onPlayerSpawned',
            'onPlayerRemoved',
            'onPlayerRemoved',
            'onTick',
            'onFinished',
        ]);

        // Verify that the user data counter has been incremented.
        assert.equal(userData.counter, 1);

        await game;  // make sure that the game has finished
    });

    it('should eject participants from a game when they disconnect', async (assert) => {
        const description = new GameDescription(Game, { name: 'Bubble', goal: '' });
        const runtime = await prepareGame(description, [ gunther, russell ]);

        assert.isNotNull(manager.getPlayerActivity(gunther));
        assert.isNotNull(manager.getPlayerActivity(russell));

        const game = runtime.run();

        gunther.disconnectForTesting();

        await runGameLoop();

        assert.isNull(manager.getPlayerActivity(gunther));
        assert.isNotNull(manager.getPlayerActivity(russell));

        russell.disconnectForTesting();

        await runGameLoop();

        assert.isNull(manager.getPlayerActivity(gunther));
        assert.isNull(manager.getPlayerActivity(russell));

        await runtime.finalize();
        await Promise.all([ game, runGameLoop() ]);
    });

    it('should eject participants from a game when they use /leave', async (assert) => {
        const description = new GameDescription(Game, { name: 'Bubble', goal: '' });
        const runtime = await prepareGame(description, [ gunther, russell ]);

        assert.isNotNull(manager.getPlayerActivity(gunther));
        assert.isNotNull(manager.getPlayerActivity(russell));

        const game = runtime.run();

        assert.isTrue(await gunther.issueCommand('/leave'));
        await runGameLoop();

        assert.isNull(manager.getPlayerActivity(gunther));
        assert.isNotNull(manager.getPlayerActivity(russell));

        assert.isTrue(await russell.issueCommand('/leave'));
        await runGameLoop();

        assert.isNull(manager.getPlayerActivity(gunther));
        assert.isNull(manager.getPlayerActivity(russell));

        await runtime.finalize();
        await Promise.all([ game, runGameLoop() ]);
    });

    it('should assign and maintain an appropriate ScopedEntities for each game', async (assert) => {
        let vehicle = null;

        const description = new GameDescription(class extends Game {
            async onInitialized(settings) {
                vehicle = this.scopedEntities.createVehicle({
                    modelId: 432,  // tank
                    position: new Vector(0, 0, 0),
                })
            }
        }, { name: 'Bubble', goal: 'Have entities' });

        assert.isNull(vehicle);

        const runtime = await prepareGame(description, [ gunther ]);
        const game = runtime.run();

        assert.isNotNull(vehicle);
        assert.isTrue(vehicle.isConnected());
        assert.equal(vehicle.virtualWorld, runtime.virtualWorld);

        await Promise.all([ runtime.removePlayer(gunther), runGameLoop() ]);
        await runtime.finalize();

        await Promise.all([ game, runGameLoop() ]);

        assert.isFalse(vehicle.isConnected());
    });

    it('includes a countdown when configured for the game', async (assert) => {
        let personalizedCountdown = null;

        const description = new GameDescription(class extends Game {
            async onPlayerSpawned(player, countdown) {
                personalizedCountdown = countdown;
            }

        }, {
            name: 'Bubble',
            goal: 'Have entities',
            countdown: 4,
            countdownCamera: [
                new Vector(41.055019, -45.301830, 37.605308),
                new Vector(30.323097, 86.002151, 44.803482),
            ],
            countdownView: [
                new Vector(37.480472, -42.009181, 36.430114),
                new Vector(29.568088, 81.170539, 43.761600),
            ],
        });

        const runtime = await prepareGame(description, [ gunther ]);
        const game = runtime.run();

        assert.typeOf(personalizedCountdown, 'function');
        assert.isTrue(await gunther.issueCommand('/leave'));

        await Promise.all([ game, runGameLoop() ]);
    });

    it('should be able to run games through this feature end-to-end', async (assert) => {
        const feature = server.featureManager.loadFeature('games');
        const settings = server.featureManager.loadFeature('settings');

        const options = {
            name: 'Bubble',
            goal: 'Kill each other with a minigun from a car',
            command: 'bubblegame',
            minimumPlayers: 2,
            maximumPlayers: 4,
            price: 250,

            environment: {
                gravity: 'Low',
                time: 'Afternoon',
                weather: 'Foggy',
            },
        };

        let vehicles = [ null, null ];
        feature.registerGame(class extends GameBase {
            nextPlayerIndex_ = 0;
            playerIndex_ = new Map();

            async onInitialized(settings, userData) {
                await super.onInitialized(settings, userData);

                vehicles[0] = this.scopedEntities.createVehicle({
                    modelId: 432,  // tank
                    position: new Vector(0, 0, 0),
                });

                vehicles[1] = this.scopedEntities.createVehicle({
                    modelId: 432,  // tank
                    position: new Vector(20, 20, 0),
                });
            }

            async onPlayerAdded(player) {
                await super.onPlayerAdded(player);

                this.playerIndex_.set(player, this.nextPlayerIndex_++);
            }

            async onPlayerSpawned(player) {
                await super.onPlayerSpawned(player);

                player.enterVehicle(vehicles[this.playerIndex_.get(player)]);
            }

            async onPlayerDeath(player, killer, reason) {
                await super.onPlayerDeath(player, killer, reason);

                await this.playerLost(player);
                await this.playerWon(killer, 25);
            }

        }, options);

        finance.givePlayerCash(gunther, 400);
        finance.givePlayerCash(russell, 1000);

        assert.isTrue(await gunther.issueCommand('/bubblegame'));
        assert.isTrue(await russell.issueCommand('/bubblegame'));

        assert.equal(finance.getPlayerCash(gunther), 150);
        assert.equal(finance.getPlayerCash(russell), 750);

        assert.isNotNull(manager.getPlayerActivity(gunther));
        assert.equal(
            manager.getPlayerActivity(gunther).getActivityState(), GameActivity.kStateRegistered);

        assert.isNotNull(manager.getPlayerActivity(russell));
        assert.equal(
            manager.getPlayerActivity(russell).getActivityState(), GameActivity.kStateRegistered);
        
        assert.deepEqual(gunther.time, [ 0, 0 ]);
        assert.equal(gunther.gravity, Player.kDefaultGravity);

        await server.clock.advance(settings.getValue('games/registration_expiration_sec') * 1000);
        await runGameLoop();

        assert.equal(manager.registrations_.size, 0);
        assert.equal(manager.runtimes_.size, 1);

        const runtime = [ ...manager.runtimes_.values() ][0];

        assert.isNotNull(manager.getPlayerActivity(gunther));
        assert.equal(
            manager.getPlayerActivity(gunther).getActivityState(), GameActivity.kStateEngaged);

        assert.isNotNull(manager.getPlayerActivity(russell));
        assert.equal(
            manager.getPlayerActivity(russell).getActivityState(), GameActivity.kStateEngaged);
        
        assert.deepEqual(gunther.time, [ EnvironmentSettings.getTimeForOption('Afternoon'), 20 ]);
        assert.equal(gunther.gravity, EnvironmentSettings.getGravityForOption('Low'));

        assert.equal(runtime.state, GameRuntime.kStateRunning);

        assert.isNotNull(vehicles[0]);
        assert.equal(vehicles[0].virtualWorld, runtime.virtualWorld);
        assert.equal(gunther.vehicle, vehicles[0]);
        assert.equal(gunther.virtualWorld, runtime.virtualWorld);

        assert.isNotNull(vehicles[1]);
        assert.equal(vehicles[1].virtualWorld, runtime.virtualWorld);
        assert.equal(russell.vehicle, vehicles[1]);
        assert.equal(russell.virtualWorld, runtime.virtualWorld);

        // Have |russell| kill |gunther| with a minigun, because that's what you do in a Bubble game
        dispatchEvent('playerresolveddeath', {
            playerid: gunther.id,
            killerid: russell.id,
            reason: 38,  // WEAPON_MINIGUN
        })

        await runGameLoop();

        // Both players have been told to leave the game, so it should now have been finalized.
        assert.equal(runtime.state, GameRuntime.kStateFinalized);
        assert.equal(manager.runtimes_.size, 0);

        assert.equal(gunther.messages.length, 3);
        assert.equal(
            gunther.messages[2],
            Message.format(Message.GAME_RESULT_FINISHED, 'Bubble', 2, 'nd', ''));

        assert.equal(russell.messages.length, 4);
        assert.equal(
            russell.messages[2],
            Message.format(Message.GAME_RESULT_FINISHED, 'Bubble', 1, 'st',
                           ', with a score of 25'));

        assert.equal(russell.messages[3], Message.format(Message.GAME_RESULT_FINISHED_AWARD, 500));

        // Make sure that the money has been divided as expected.
        assert.equal(finance.getPlayerCash(gunther), 150);
        assert.equal(finance.getPlayerCash(russell), 1250);

        // Make sure that gravity was reset.
        assert.equal(gunther.gravity, Player.kDefaultGravity);
    });

    it('is able to proportionally calculate the prize money', assert => {
        const description = new GameDescription(Game, { name: 'Bubble', goal: '' });
        const runtime = new GameRuntime(
            manager, description, kDefaultSettings, () => finance, () => nuwani, () => spectate);

        runtime.prizeMoney_ = 10000;

        const expectedAwards = [
            {
                players: [ 'Gunther', 'Russell', 'Lucy', 'Joe' ],
                awards: [ 7000, 2000, 1000, 0 ],
            },
            {
                players: [ 'Gunther', 'Russell', 'Lucy' ],
                awards: [ 7500, 2500, 0 ],
            },
            {
                players: [ 'Gunther', 'Russell' ],
                awards: [ 10000, 0 ],
            },
            {
                players: [ 'Gunther' ],
                awards: [ 0 ],
            }
        ];

        for (const testCase of expectedAwards) {
            runtime.players_ = new Set(testCase.players);
            runtime.playerCount_ = testCase.players.length;

            do {
                const player = testCase.players.pop();
                const award = testCase.awards.pop();

                assert.setContext(`${runtime.playerCount_}p/${runtime.players_.size}/${player}`);
                assert.equal(runtime.calculatePrizeMoneyShare(), award);

                runtime.players_.delete(player);

            } while (testCase.players.length > 0)
        }
    });

    it('should enable players to join continuous games at any time', async (assert) => {
        const feature = server.featureManager.loadFeature('games');

        let activePlayers = 0;
        let initialized = false;

        feature.registerGame(class extends Game {
            async onInitialized(settings) {
                if (initialized)
                    throw new Error('The game already has been initialized.');
                
                initialized = true;
            }

            async onPlayerAdded(player) { ++activePlayers; }
            async onPlayerRemoved(player) { --activePlayers; }
        }, {
            name: 'Bubble',
            goal: 'Have entities',

            command: 'bubblegame',
            price: 500,

            continuous: true,
            minimumPlayers: 1,
            maximumPlayers: 4,
        });

        finance.givePlayerCash(gunther, 2500);
        finance.givePlayerCash(russell, 2500);

        assert.isNull(manager.getPlayerActivity(gunther));
        assert.isNull(manager.getPlayerActivity(russell));

        // (1) The game should start immediately for |gunther|, even though other players are
        // available. This is because it's been marked as a continuous game.
        assert.isTrue(await gunther.issueCommand('/bubblegame'));
        assert.equal(gunther.messages.length, 1);

        assert.isNotNull(manager.getPlayerActivity(gunther));
        assert.equal(
            manager.getPlayerActivity(gunther).getActivityState(), GameActivity.kStateEngaged);
        
        assert.equal(activePlayers, 1);

        // (2) Have Russell join the game as well. They should be added to the active game, rather
        // than be routed through registration and in a new game instead.
        assert.isTrue(await russell.issueCommand('/bubblegame'));
        assert.equal(russell.messages.length, 1);

        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1],
            Message.format(Message.GAME_CONTINUOUS_JOINED, russell.name, 'Bubble'));

        assert.isNotNull(manager.getPlayerActivity(russell));
        assert.equal(
            manager.getPlayerActivity(russell).getActivityState(), GameActivity.kStateEngaged);
        
        assert.strictEqual(manager.getPlayerActivity(gunther), manager.getPlayerActivity(russell));
        assert.equal(activePlayers, 2);

        // (3) Have Gunther leave the game. Russell should still be playing.
        assert.isTrue(await gunther.issueCommand('/leave'));

        assert.equal(russell.messages.length, 2);
        assert.equal(
            russell.messages[1],
            Message.format(Message.GAME_CONTINUOUS_LEFT, gunther.name, 'Bubble'));

        assert.isNull(manager.getPlayerActivity(gunther));
        assert.equal(activePlayers, 1);

        assert.isNotNull(manager.getPlayerActivity(russell));
        assert.equal(
            manager.getPlayerActivity(russell).getActivityState(), GameActivity.kStateEngaged);

        // (4) When Russell leaves the game as well, it should be stopped. Here we mimic that by
        // Russell disconnecting, because we're already testing the `/leave` command above.
        russell.disconnectForTesting();

        // Wait until there are no more active runtimes, to verify state is cleaned up.
        while (manager.activeRuntimesForTesting.size)
            await server.clock.advance(50);
    });

    it('should have a sensible description when casted to a string', assert => {
        const description = new GameDescription(Game, { name: 'Bubble', goal: '' });
        const runtime = new GameRuntime(
            manager, description, kDefaultSettings, () => finance, () => nuwani, () => spectate);

        assert.equal(String(runtime), '[GameActivity: Bubble (engaged)]');

        const customDescription = new GameDescription(Game, {
            name: (settings) => {
                if (settings.has('bubble/difficulty'))
                    return 'Extreme Bubble';
                
                return 'Bubble';
            },
            goal: ''
        });

        const customRuntime = new GameRuntime(
            manager, customDescription, new Map([ [ 'bubble/difficulty', 'extreme' ] ]),
            () => finance, () => nuwani, () => spectate);

        assert.equal(String(customRuntime), '[GameActivity: Extreme Bubble (engaged)]');
    });
});
