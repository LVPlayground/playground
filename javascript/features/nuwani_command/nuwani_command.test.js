// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import NuwaniCommand from 'features/nuwani_command/nuwani_command.js';
import MockPlayground from 'features/playground/test/mock_playground.js';

describe('NuwaniCommand', (it, beforeEach) => {
    let nuwani = null;
    let gunther = null;

    beforeEach(() => {
        nuwani = server.featureManager.loadFeature('nuwani');
        gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.level = Player.LEVEL_MANAGEMENT;

        server.featureManager.registerFeaturesForTests({
            nuwani_command: NuwaniCommand,
            playground: MockPlayground,
        });

        server.featureManager.loadFeature('nuwani_command');
    });

    it('should only be available to managers by default, but be configurable', async (assert) => {
        gunther.level = Player.LEVEL_PLAYER;

        await gunther.issueCommand('/nuwani');

        assert.equal(gunther.messages.length, 1);
        assert.equal(
            gunther.messages[0],
            Message.format(Message.COMMAND_ERROR_INSUFFICIENT_RIGHTS, 'specific people'));

        gunther.level = Player.LEVEL_MANAGEMENT;

        gunther.respondToDialog({ response: 0 /* Dismiss */ });
        await gunther.issueCommand('/nuwani');

        assert.equal(gunther.lastDialogTitle, 'Nuwani IRC Bot');
        assert.equal(gunther.messages.length, 1);

        gunther.clearLastDialog();
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        await gunther.issueCommand('/nuwani');

        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1],
            Message.format(Message.COMMAND_ERROR_INSUFFICIENT_RIGHTS, 'specific people'));
        
        const playground = server.featureManager.loadFeature('playground');

        // Change the command's level in the Playground feature
        playground.access.setCommandLevel('nuwani', Player.LEVEL_ADMINISTRATOR);

        gunther.respondToDialog({ response: 0 /* Dismiss */ });
        await gunther.issueCommand('/nuwani');

        assert.equal(gunther.lastDialogTitle, 'Nuwani IRC Bot');
        assert.equal(gunther.messages.length, 2);
    });

    it('should be able to list the active and available bots', async (assert) => {
        gunther.respondToDialog({ listitem: 0 /* Inspect bot status */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));
        
        await gunther.issueCommand('/nuwani');
        
        assert.equal(gunther.lastDialogTitle, 'Nuwani: bot status');

        const status = gunther.getLastDialogAsTable();

        assert.equal(status.rows.length, 1);
        assert.deepEqual(status.rows[0], [
            'NuwaniJS',
            '{ff782f}disconnected',
            /* command rate= */ '0',
        ]);
    });
});
