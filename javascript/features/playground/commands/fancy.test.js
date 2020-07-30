// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { MockPlaygroundCommands } from 'features/playground/test/mock_playground_commands.js';

describe('FancyCommand', (it, beforeEach, afterEach) => {
    let commands = null;
    let gunther = null;

    beforeEach(async() => {
        commands = new MockPlaygroundCommands();
        await commands.loadCommands();

        gunther = server.playerManager.getById(0 /* Gunther */);

        await gunther.identify();
    });

    afterEach(() => commands.dispose());

    it('should not allow players to fancy others', async(assert) => {
        return;  // disabled

        const russell = server.playerManager.getById(1 /* Gunther */);
        await russell.identify();

        assert.isTrue(await gunther.issueCommand('/fancy 1 cow'));
        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], 'Only administrators can fancy other players.');
    });

    it('should allow administrators to fancy others', async(assert) => {
        const russell = server.playerManager.getById(1 /* Gunther */);
        await russell.identify();

        gunther.level = Player.LEVEL_ADMINISTRATOR
        
        assert.isTrue(await gunther.issueCommand('/fancy 1 cow'));
        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], russell.name + ' is now a cow.');
    });
});
