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

        server.featureManager.registerFeaturesForTests({
            playground: MockPlayground,
            streamer: Streamer,
            vehicles: Vehicles
        });

        const vehicles = server.featureManager.loadFeature('vehicles');

        commands = vehicles.commands_;
        manager = vehicles.manager_;
        await manager.ready;
    });

    // TODO: We'll actually want to make this available to all the players.
    // See the following issue: https://github.com/LVPlayground/playground/issues/330
    it('should limit /v to administrators only', async(assert) => {
        assert.equal(gunther.level, Player.LEVEL_PLAYER);

        assert.isTrue(gunther.issueCommand('/v'));
        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
                     Message.format(Message.COMMAND_ERROR_INSUFFICIENT_RIGHTS, 'specific players'));
    });

    it('should clean up the commands when being disposed of', async(assert) => {
        const originalCommandCount = server.commandManager.size;

        commands.dispose();
        commands.dispose = () => true;

        assert.equal(server.commandManager.size, originalCommandCount - 1);
    });
});
