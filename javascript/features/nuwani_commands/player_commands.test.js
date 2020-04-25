// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { PlayerCommands } from 'features/nuwani_commands/player_commands.js';
import { TestBot } from 'features/nuwani/test/test_bot.js';

import { issueCommand } from 'features/nuwani/commands/command_helpers.js';

describe('PlayerCommands', (it, beforeEach, afterEach) => {
    let bot = null;
    let commands = null;

    beforeEach(() => {
        const nuwani = server.featureManager.loadFeature('nuwani');

        bot = new TestBot();
        commands = new PlayerCommands(nuwani.commandManager);
    });

    afterEach(() => {
        commands.dispose();
        bot.dispose();
    });

    it('should do something', async (assert) => {

    });
});
