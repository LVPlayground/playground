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
    const kEnvironmentIndex = 2;
    const kLagCompensationIndex = 3;
    const kMapMarkersIndex = 4;
    const kObjectiveIndex = 5;
    const kSpawnArmourIndex = 6;
    const kSpawnWeaponsIndex = 7;
    const kTeamDamageIndex = 8;
    const kTeamsIndex = 9;

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

        class BubbleGame extends DeathmatchGame {}

        feature.registerGame(BubbleGame, {
            name: 'Bubble Fighting Game',
            goal: 'Fight each other with bubbles',

            command: 'bubble',
            price: 0,

            mapMarkers: 'Team only',
            teams: 'Balanced teams',
            teamDamage: false,

            minimumPlayers: 3,
            maximumPlayers: 4,
        });

        assert.equal(gunther.team, Player.kNoTeam);
        assert.equal(russell.team, Player.kNoTeam);
        assert.equal(lucy.team, Player.kNoTeam);

        // All the players should be able to see each other.
        assert.isTrue(gunther.isVisibleToPlayerForTesting(russell));
        assert.isTrue(russell.isVisibleToPlayerForTesting(gunther));
        assert.isTrue(gunther.isVisibleToPlayerForTesting(lucy));
        assert.isTrue(russell.isVisibleToPlayerForTesting(lucy));
        assert.isTrue(lucy.isVisibleToPlayerForTesting(gunther));
        assert.isTrue(lucy.isVisibleToPlayerForTesting(russell));

        assert.isTrue(await gunther.issueCommand('/bubble'));
        assert.isTrue(await lucy.issueCommand('/bubble'));
        assert.isTrue(await russell.issueCommand('/bubble'));

        await server.clock.advance(settings.getValue('games/registration_expiration_sec') * 1000);
        await runGameLoop();

        const game = getGameInstance();

        assert.equal(game.getTeamForPlayer(gunther), DeathmatchGame.kTeamAlpha);
        assert.equal(game.getTeamForPlayer(russell), DeathmatchGame.kTeamAlpha);
        assert.equal(game.getTeamForPlayer(lucy), DeathmatchGame.kTeamBravo);

        // Gunther and Russell should be able to see each other, but not Lucy. Lucy shouldn't be
        // able to see either, based on the game's configuration.
        assert.isTrue(gunther.isVisibleToPlayerForTesting(russell));
        assert.isTrue(russell.isVisibleToPlayerForTesting(gunther));
        assert.isFalse(gunther.isVisibleToPlayerForTesting(lucy));
        assert.isFalse(russell.isVisibleToPlayerForTesting(lucy));
        assert.isFalse(lucy.isVisibleToPlayerForTesting(gunther));
        assert.isFalse(lucy.isVisibleToPlayerForTesting(russell));

        assert.equal(gunther.team, game.getTeamForPlayer(gunther));
        assert.equal(russell.team, game.getTeamForPlayer(russell));
        assert.equal(lucy.team, game.getTeamForPlayer(lucy));

        assert.equal(gunther.team, russell.team);

        assert.equal(gunther.getColorForPlayerForTesting(russell).a, 0xAA);
        assert.equal(gunther.getColorForPlayerForTesting(lucy).a, 0x00);  // invisible

        assert.equal(russell.getColorForPlayerForTesting(gunther).a, 0xAA);
        assert.equal(russell.getColorForPlayerForTesting(lucy).a, 0x00);  // invisible
        
        assert.equal(lucy.getColorForPlayerForTesting(gunther).a, 0x00);  // invisible
        assert.equal(lucy.getColorForPlayerForTesting(russell).a, 0x00);  // invisible

        assert.isTrue(await gunther.issueCommand('/leave'));
        assert.isTrue(await russell.issueCommand('/leave'));
        assert.isTrue(await lucy.issueCommand('/leave'));

        await runGameLoop();

        // Verify that the Game instance has been destroyed, together with all supporting infra.
        assert.throws(() => getGameInstance());

        assert.equal(gunther.team, Player.kNoTeam);
        assert.equal(russell.team, Player.kNoTeam);
        assert.equal(lucy.team, Player.kNoTeam);

        // All the players should be able to see each other again.
        assert.isTrue(gunther.isVisibleToPlayerForTesting(russell));
        assert.isTrue(russell.isVisibleToPlayerForTesting(gunther));
        assert.isTrue(gunther.isVisibleToPlayerForTesting(lucy));
        assert.isTrue(russell.isVisibleToPlayerForTesting(lucy));
        assert.isTrue(lucy.isVisibleToPlayerForTesting(gunther));
        assert.isTrue(lucy.isVisibleToPlayerForTesting(russell));
    });

    it('should award players spawn armour and weapons, as configured', async (assert) => {
        class BubbleGame extends DeathmatchGame {}

        feature.registerGame(BubbleGame, {
            name: 'Bubble Fighting Game',
            goal: 'Fight each other with bubbles',

            command: 'bubble',
            continuous: true,
            price: 0,

            spawnArmour: true,
            spawnWeapons: [
                { weapon: 14, ammo: 1 },
                { weapon: 23, ammo: 100 },
            ],

            minimumPlayers: 1,
            maximumPlayers: 4,
        });

        assert.equal(gunther.armour, 0);

        assert.isTrue(await gunther.issueCommand('/bubble'));
        assert.equal(gunther.syncedData.minigameName, 'Bubble Fighting Game');

        await runGameLoop();  // fully initialize the game

        assert.equal(gunther.armour, 100);
        assert.deepEqual([ ...gunther.getWeaponsForTesting() ], [
            [ 14, 1 ],
            [ 23, 100 ],
        ]);

        assert.isTrue(await gunther.issueCommand('/leave'));
        assert.equal(gunther.syncedData.minigameName, '');

        assert.throws(() => game.getStatisticsForPlayer(gunther));
    });

    it('should support the different objectives for each game', async (assert) => {
        // TODO: Test as we implement
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

        assert.throws(() => game.getStatisticsForPlayer(gunther));
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
            objective: { type: 'Continuous' },
            teamDamage: false,

            minimumPlayers: 1,
            maximumPlayers: 4,
        });

        assert.equal(gunther.syncedData.lagCompensationMode, Player.kDefaultLagCompensationMode);

        gunther.respondToDialog({ listitem: kLagCompensationIndex }).then(
            () => gunther.respondToDialog({ listitem: 0 /* enabled */ })).then(
            () => gunther.respondToDialog({ listitem: kMapMarkersIndex })).then(
            () => gunther.respondToDialog({ listitem: 2 /* disabled */ })).then(
            () => gunther.respondToDialog({ listitem: kEnvironmentIndex })).then(
            () => gunther.respondToDialog({ listitem: 0 /* gravity */ })).then(
            () => gunther.respondToDialog({ listitem: 2 /* high */ })).then(
            () => gunther.respondToDialog({ listitem: kTeamsIndex })).then(
            () => gunther.respondToDialog({ listitem: 2 /* random teams */ })).then(
            () => gunther.respondToDialog({ listitem: kSpawnWeaponsIndex })).then(
            () => gunther.respondToDialog({ listitem: 1 /* weapon set */ })).then(
            () => gunther.respondToDialog({ listitem: 2 /* walk weapons */ })).then(
            () => gunther.respondToDialog({ listitem: kTeamDamageIndex })).then(
            () => gunther.respondToDialog({ listitem: 1 /* disabled */ })).then(
            () => gunther.respondToDialog({ listitem: kSpawnArmourIndex })).then(
            () => gunther.respondToDialog({ listitem: 0 /* enabled */ })).then(
            () => gunther.respondToDialog({ listitem: kStartGameIndex }));

        assert.isTrue(await gunther.issueCommand('/bubble custom'));
        assert.equal(gunther.syncedData.minigameName, 'Bubble Fighting Game');

        await runGameLoop();  // fully initialize the game

        // Overridden from the default through the customization menu:
        assert.equal(gunther.syncedData.lagCompensationMode, Player.kDefaultLagCompensationMode);
        assert.equal(gunther.gravity, 0.012);
        assert.equal(gunther.armour, 100);

        assert.deepEqual([ ...gunther.getWeaponsForTesting() ], [
            [ 24 /* Desert Eagle */, 150 ],
            [ 31 /* M4 */, 400 ],
            [ 34 /* Sniper Rifle */, 100 ],
        ]);

        assert.notEqual(gunther.team, Player.kNoTeam);

        // TODO: Verify map markers.

        assert.isTrue(await gunther.issueCommand('/leave'));
        assert.equal(gunther.syncedData.minigameName, '');

        assert.equal(gunther.syncedData.lagCompensationMode, Player.kDefaultLagCompensationMode);
        assert.equal(gunther.gravity, Player.kDefaultGravity);

        assert.equal(gunther.team, Player.kNoTeam);

        // TODO: Verify map markers.
    });
});
