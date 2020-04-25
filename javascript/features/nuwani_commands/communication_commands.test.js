// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommunicationCommands } from 'features/nuwani_commands/communication_commands.js';
import { TestBot } from 'features/nuwani/test/test_bot.js';

import { issueCommand } from 'features/nuwani/commands/command_helpers.js';

describe('CommunicationCommands', (it, beforeEach, afterEach) => {
    let bot = null;
    let commands = null;

    beforeEach(() => {
        const nuwani = server.featureManager.loadFeature('nuwani');

        bot = new TestBot();
        commands = new CommunicationCommands(nuwani.commandManager);
    });

    afterEach(() => {
        commands.dispose();
        bot.dispose();
    });

    it('should do something', async (assert) => {

    });
});
