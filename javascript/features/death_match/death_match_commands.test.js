// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DeathMatchCommands } from "features/death_match/death_match_commands.js";

describe('DeathMatchManager', (it, beforeEach) => {
    let commands = null;

    beforeEach(async => {
        commands = new DeathMatchCommands();
    });

    it('should allow to use gang zoe 1', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.isTrue(await gunther.issueCommand('/dm 1'));

        assert.equal(gunther.messages.length, 0);
    });

    it('should show message for player if using invalid dm zone', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.isTrue(await gunther.issueCommand('/dm 0'));

        assert.equal(gunther.messages.length, 1);
        assert.isTrue(
            gunther.messages[0].includes(
                Message.format(Message.DEATH_MATCH_INVALID_ZONE, 0)));
    });
});