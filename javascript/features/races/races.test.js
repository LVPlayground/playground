// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('Races', it => {
    it('should register the race game when its dependency is reloaded', async (assert) => {
        server.featureManager.loadFeature('races');

        assert.isTrue(server.commandManager.hasCommand('race'));

        assert.isTrue(await server.featureManager.liveReload('races'));
        assert.isTrue(server.commandManager.hasCommand('race'));

        assert.isTrue(await server.featureManager.liveReload('games_vehicles'));
        assert.isTrue(server.commandManager.hasCommand('race'));

        assert.isTrue(await server.featureManager.liveReload('games'));
        assert.isTrue(server.commandManager.hasCommand('race'));

        assert.isTrue(await server.featureManager.liveReload('games_vehicles'));
        assert.isTrue(server.commandManager.hasCommand('race'));

        assert.isTrue(await server.featureManager.liveReload('races'));
        assert.isTrue(server.commandManager.hasCommand('race'));

        assert.isTrue(await server.featureManager.liveReload('games'));
        assert.isTrue(server.commandManager.hasCommand('race'));
    });

    it('should be able to load all races defined in the JSON files', assert => {
        const feature = server.featureManager.loadFeature('races');
        const registry = feature.registry_;

        // If this test fails, then there's a configuration error in one of the JSON files that
        // contain the races available on Las Venturas Playground. Check out the detailed error.
        registry.ensureInitialized();

        // Iterate over each of the races, and make sure we can get them by ID.
        let iterations = 0;

        for (const description of registry.descriptions()) {
            assert.strictEqual(registry.getDescription(description.id), description);
            iterations++;
        }

        assert.isAbove(iterations, 0);
    });
});
