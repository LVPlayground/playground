// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathmatchGame } from 'features/games_deathmatch/deathmatch_game.js';

import { kDefaultTickIntervalMs } from 'features/games/game_description.js';

describe('GamesDeathmatch', (it, beforeEach) => {
    let feature = null;
    let games = null;
    let gunther = null;
    let settings = null;

    beforeEach(() => {
        feature = server.featureManager.loadFeature('games_deathmatch');
        games = server.featureManager.loadFeature('games');
        gunther = server.playerManager.getById(/* Gunther= */ 0);
        settings = server.featureManager.loadFeature('settings');
    });

    // Returns the Game instance of the currently running game. When there are multiple games live
    // on the server, only the first will be returned.
    function getGameInstance() {
        if (!games.manager_.runtimes_.size)
            throw new Error('There currently are no running games on the server.');

        // Return the Game instance, which is what this layer cares about.
        return [ ...games.manager_.runtimes_ ][0].game_;
    }

    // Runs the loop that keeps the game alive, i.e. continues to fire timers and microtasks in a
    // deterministic manner to match what would happen in a production environment.
    async function runGameLoop() {
        for (let tick = 0; tick <= 2; ++tick) {
            await server.clock.advance(kDefaultTickIntervalMs);
            for (let i = 0; i < 5; ++i)
                await Promise.resolve();
        }
    }

    // Indices for the automatically inserted options in the customization menu.
    const kStartGameIndex = 0;
    const kLagCompensationIndex = 2;
    const kMapMarkersIndex = 3;
    const kTeamDamageIndex = 4;

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

    it('should be able to change lag compensation mode for a game', async (assert) => {
        class BubbleGame extends DeathmatchGame {}

        feature.registerGame(BubbleGame, {
            name: 'Bubble Fighting Game',
            goal: 'Fight each other with bubbles',

            command: 'bubble',
            continuous: true,
            price: 0,

            lagCompensation: false,

            minimumPlayers: 1,
            maximumPlayers: 4,
        });

        assert.equal(gunther.syncedData.lagCompensationMode, Player.kDefaultLagCompensationMode);

        assert.isTrue(await gunther.issueCommand('/bubble'));
        assert.equal(gunther.syncedData.minigameName, 'Bubble Fighting Game');

        await runGameLoop();  // fully initialize the game

        assert.equal(gunther.syncedData.lagCompensationMode, /* lag shot= */ 0);

        assert.isTrue(await gunther.issueCommand('/leave'));
        assert.equal(gunther.syncedData.minigameName, '');

        assert.equal(gunther.syncedData.lagCompensationMode, Player.kDefaultLagCompensationMode);
    });

    it('should be able to change map markers and team damage in a game', async (assert) => {
        const russell = server.playerManager.getById(/* Russell= */ 1);
        const lucy = server.playerManager.getById(/* Lucy= */ 2);

        class BubbleGame extends DeathmatchGame {
            async onInitialized(settings) {
                await super.onInitialized(settings);
                this.mode = DeathmatchGame.kModeTeams;
            }

            async onPlayerAdded(player) {
                await super.onPlayerAdded(player);
                switch (player) {
                    case gunther:
                    case russell:
                        this.setTeamForPlayer(player, DeathmatchGame.kTeamAlpha);
                        break;

                    case lucy:
                        this.setTeamForPlayer(player, DeathmatchGame.kTeamBravo);
                        break;
                }
            }
        }

        feature.registerGame(BubbleGame, {
            name: 'Bubble Fighting Game',
            goal: 'Fight each other with bubbles',

            command: 'bubble',
            price: 0,

            mapMarkers: 'Team only',
            teamDamage: false,

            minimumPlayers: 3,
            maximumPlayers: 4,
        });

        assert.equal(gunther.team, Player.kNoTeam);
        assert.equal(russell.team, Player.kNoTeam);
        assert.equal(lucy.team, Player.kNoTeam);

        assert.isTrue(await gunther.issueCommand('/bubble'));
        assert.isTrue(await russell.issueCommand('/bubble'));
        assert.isTrue(await lucy.issueCommand('/bubble'));

        await server.clock.advance(settings.getValue('games/registration_expiration_sec') * 1000);
        await runGameLoop();

        const game = getGameInstance();

        assert.equal(game.getTeamForPlayer(gunther), DeathmatchGame.kTeamAlpha);
        assert.equal(game.getTeamForPlayer(russell), DeathmatchGame.kTeamAlpha);
        assert.equal(game.getTeamForPlayer(lucy), DeathmatchGame.kTeamBravo);

        // TODO: Verify the expected map marker visibility.
        
        assert.equal(gunther.team, game.getTeamForPlayer(gunther));
        assert.equal(russell.team, game.getTeamForPlayer(russell));
        assert.equal(lucy.team, game.getTeamForPlayer(lucy));

        assert.equal(gunther.team, russell.team);

        assert.isTrue(await gunther.issueCommand('/leave'));
        assert.isTrue(await russell.issueCommand('/leave'));
        assert.isTrue(await lucy.issueCommand('/leave'));

        await runGameLoop();

        // Verify that the Game instance has been destroyed, together with all supporting infra.
        assert.throws(() => getGameInstance());

        assert.equal(gunther.team, Player.kNoTeam);
        assert.equal(russell.team, Player.kNoTeam);
        assert.equal(lucy.team, Player.kNoTeam);

    });

    it('should maintain statistics of all participants in the game', async (assert) => {
        class BubbleGame extends DeathmatchGame {}

        feature.registerGame(BubbleGame, {
            name: 'Bubble Fighting Game',
            goal: 'Fight each other with bubbles',

            command: 'bubble',
            continuous: true,
            price: 0,

            lagCompensation: false,

            minimumPlayers: 1,
            maximumPlayers: 4,
        });

        gunther.shoot();

        assert.equal(gunther.stats.session.shotsMissed, 1);

        // Wait until the cooldown period for shooting your gun has passed.
        await server.clock.advance(
            settings.getValue('limits/deathmatch_weapon_fired_cooldown') * 1000);

        assert.isTrue(await gunther.issueCommand('/bubble'));
        assert.equal(gunther.syncedData.minigameName, 'Bubble Fighting Game');

        await runGameLoop();  // fully initialize the game

        const game = getGameInstance();
        {
            const stats = game.getStatisticsForPlayer(gunther);

            assert.isNotNull(stats);
            assert.equal(stats.shotsMissed, 0);
        }
        
        for (let shot = 0; shot < 10; ++shot)
            gunther.shoot();
        
        {
            const stats = game.getStatisticsForPlayer(gunther);

            assert.isNotNull(stats);
            assert.equal(stats.shotsMissed, 10);
        }

        assert.isTrue(await gunther.issueCommand('/leave'));
        assert.equal(gunther.syncedData.minigameName, '');

        assert.isNull(game.getStatisticsForPlayer(gunther));
    });

    it('should enable players to customise the settings', async (assert) => {
        class BubbleGame extends DeathmatchGame {}

        feature.registerGame(BubbleGame, {
            name: 'Bubble Fighting Game',
            goal: 'Fight each other with bubbles',

            command: 'bubble',
            continuous: true,
            price: 0,

            lagCompensation: false,
            mapMarkers: 'Team only',
            teamDamage: false,

            minimumPlayers: 1,
            maximumPlayers: 4,
        });

        assert.equal(gunther.syncedData.lagCompensationMode, Player.kDefaultLagCompensationMode);

        gunther.respondToDialog({ listitem: kLagCompensationIndex }).then(
            () => gunther.respondToDialog({ listitem: 0 /* enabled */ })).then(
            () => gunther.respondToDialog({ listitem: kMapMarkersIndex })).then(
            () => gunther.respondToDialog({ listitem: 2 /* disabled */ })).then(
            () => gunther.respondToDialog({ listitem: kTeamDamageIndex })).then(
            () => gunther.respondToDialog({ listitem: 0 /* enabled */ })).then(
            () => gunther.respondToDialog({ listitem: kStartGameIndex }));

        assert.isTrue(await gunther.issueCommand('/bubble custom'));
        assert.equal(gunther.syncedData.minigameName, 'Bubble Fighting Game');

        await runGameLoop();  // fully initialize the game

        // Overridden from the default through the customization menu:
        assert.equal(gunther.syncedData.lagCompensationMode, Player.kDefaultLagCompensationMode);

        // TODO: Verify map markers.
        // TODO: Verify team damage.

        assert.isTrue(await gunther.issueCommand('/leave'));
        assert.equal(gunther.syncedData.minigameName, '');

        assert.equal(gunther.syncedData.lagCompensationMode, Player.kDefaultLagCompensationMode);

        // TODO: Verify map markers.
        // TODO: Verify team damage.
    });
});
