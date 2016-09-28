// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MockPlayground = require('features/playground/test/mock_playground.js');
const Streamer = require('features/streamer/streamer.js');
const Vehicles = require('features/vehicles/vehicles.js');

describe('VehicleCommands', (it, beforeEach) => {
    let commands = null;
    let gunther = null;
    let manager = null;

    beforeEach(async(assert) => {
        gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify();

        server.featureManager.registerFeaturesForTests({
            playground: MockPlayground,
            streamer: Streamer,
            vehicles: Vehicles
        });

        const vehicles = server.featureManager.loadFeature('vehicles');
        const playground = server.featureManager.loadFeature('playground');

        playground.access.addException('v', gunther);

        commands = vehicles.commands_;
        manager = vehicles.manager_;
        await manager.ready;
    });

    // TODO: We'll actually want to make this available to all the players.
    // See the following issue: https://github.com/LVPlayground/playground/issues/330
    it('should limit /v to administrators only', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);
        assert.equal(russell.level, Player.LEVEL_PLAYER);

        assert.isTrue(await russell.issueCommand('/v'));
        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0],
                     Message.format(Message.COMMAND_ERROR_INSUFFICIENT_RIGHTS, 'specific players'));
    });

    it('should not yet support the vehicle chooser dialog', async(assert) => {
        assert.isTrue(await gunther.issueCommand('/v'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.COMMAND_UNSUPPORTED);
    });

    it('should support spawning vehicles by their model Id', async(assert) => {
        for (const invalidModel of ['-15', '42', '399', '612', '1337']) {
            assert.isTrue(await gunther.issueCommand('/v ' + invalidModel));
            assert.equal(gunther.messages.length, 1);
            assert.equal(
                gunther.messages[0], Message.format(Message.VEHICLE_SPAWN_NOT_FOUND, invalidModel));

            gunther.clearMessages();
        }

        const commandPromise = gunther.issueCommand('/v 520');

        await Promise.resolve();  // to trigger the command
        await server.clock.advance(350);  // to enter the vehicle
        await commandPromise;

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.VEHICLE_SPAWN_CREATED, 'Hydra'));

        assert.isNotNull(gunther.vehicle);
        assert.equal(gunther.vehicle.modelId, 520 /* Hydra */);
    });

    it('should support spawning vehicles by their model name', async(assert) => {
        for (const invalidModel of ['fish', 'banana', 'tweezers', 'dirtbike', 'redness']) {
            assert.isTrue(await gunther.issueCommand('/v ' + invalidModel));
            assert.equal(gunther.messages.length, 1);
            assert.equal(
                gunther.messages[0], Message.format(Message.VEHICLE_SPAWN_NOT_FOUND, invalidModel));

            gunther.clearMessages();
        }

        const commandPromise = gunther.issueCommand('/v Hydra');

        await Promise.resolve();  // to trigger the command
        await server.clock.advance(350);  // to enter the vehicle
        await commandPromise;

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.VEHICLE_SPAWN_CREATED, 'Hydra'));

        assert.isNotNull(gunther.vehicle);
        assert.equal(gunther.vehicle.modelId, 520 /* Hydra */);
    });

    it('should clean up the commands when being disposed of', async(assert) => {
        const originalCommandCount = server.commandManager.size;

        commands.dispose();
        commands.dispose = () => true;

        assert.equal(server.commandManager.size, originalCommandCount - 1);
    });
});
