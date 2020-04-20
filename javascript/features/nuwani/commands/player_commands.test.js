// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandManager } from 'features/nuwani/commands/command_manager.js';
import { Configuration } from 'features/nuwani/configuration.js';
import { PlayerCommands } from 'features/nuwani/commands/player_commands.js';
import { TestBot } from 'features/nuwani/test/test_bot.js';

import { issueCommand } from 'features/nuwani/commands/command_helpers.js';

describe('PlayerCommands', (it, beforeEach, afterEach) => {
    let bot = null;
    let commandManager = null;
    let commands = null;

    beforeEach(() => {
        bot = new TestBot();
        commandManager = new CommandManager(/* runtime= */ null, new Configuration());
        commands = new PlayerCommands(commandManager);
    });

    afterEach(() => {
        commands.dispose();
        commandManager.dispose();
        bot.dispose();
    });

    it('should do something', async (assert) => {

    });
});
