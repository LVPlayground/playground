// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const PositioningCommands = require('features/commands/positioning_commands.js');
const Vector = require('base/vector.js');

describe('PositioningCommands', (it, beforeEach, afterEach) => {
    let positioningCommands = null;

    beforeEach(() => {
        positioningCommands = new PositioningCommands();
    });

    afterEach(() => {
        positioningCommands.dispose();
    });

    it('/getpos should show the x, y, z-coörds and rotation to the player', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.position = new Vector (0, 1, 2);
        const guntherPosition = gunther.position;
        gunther.facingAngle = 3;

        assert.isTrue(gunther.issueCommand('/getpos'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
            Message.format(Message.POSITIONING_CURRENT_POSITION, guntherPosition.x,
                           guntherPosition.y, guntherPosition.z, gunther.facingAngle));
    });

    it('/up can\'t be executed by a player', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.position = new Vector (1, 2, 3);

        assert.isTrue(gunther.issueCommand('/up 5'));

        assert.equal(gunther.position.z, 3);
    });

    it('/up places the crewmember on foot [distance] higher', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.level = Player.LEVEL_ADMINISTRATOR;
        gunther.position = new Vector (1, 2, 3);

        assert.isTrue(gunther.issueCommand('/up 5'));

        assert.equal(gunther.position.z, 8);
    });
});
