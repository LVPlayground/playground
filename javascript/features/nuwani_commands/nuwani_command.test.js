// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { NuwaniCommands } from 'features/nuwani_commands/nuwani_commands.js';

describe('NuwaniCommand', (it, beforeEach) => {
    let nuwani = null;
    let gunther = null;

    beforeEach(async () => {
        nuwani = server.featureManager.loadFeature('nuwani');
        gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.level = Player.LEVEL_MANAGEMENT;

        server.featureManager.registerFeaturesForTests({
            nuwani_commands: NuwaniCommands,
        });

        server.featureManager.loadFeature('nuwani_commands');

        // Gunther needs to have a registered account to execute these commands.
        await gunther.identify();
    });

    it('should be able to list the active and available bots', async (assert) => {
        gunther.respondToDialog({ listitem: 0 /* Inspect bot status */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));
        
        await gunther.issueCommand('/nuwani');
        
        assert.equal(gunther.lastDialogTitle, 'Nuwani: bot status');

        const status = gunther.getLastDialogAsTable();

        assert.equal(status.rows.length, 3);
        assert.deepEqual(status.rows,
        [
            [
                'NuwaniJS',
                '{ADFF2F}connected',
                /* command rate= */ '0',
            ],
            [
                'NuwiniJS',
                '{ADFF2F}connected',
                /* command rate= */ '0',
            ],
            [
                'NuwoniJS',
                '{BEC7CC}available',
                /* command rate= */ '0',
            ],
        ]);
    });

    it('should be able to reload the message format', async (assert) => {
        gunther.respondToDialog({ listitem: 1 /* Reload the message format */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));
        
        await gunther.issueCommand('/nuwani');

        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], Message.format(Message.NUWANI_ADMIN_MESSAGE_FORMAT,
                                                            gunther.name, gunther.id));
    });

    it('should be able to request an increases and decreases in bots', async (assert) => {
        assert.equal(nuwani.runtime.availableBots.size, 1);
        
        // (1) Request an increase having available bots.
        gunther.respondToDialog({ listitem: 2 /* Request an increase in bots... */ }).then(
            () => gunther.respondToDialog({ response: 1 /* Confirm */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        await gunther.issueCommand('/nuwani');

        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], Message.format(Message.NUWANI_ADMIN_INCREASE_BOT,
                                                            gunther.name, gunther.id));

        assert.equal(nuwani.runtime.availableBots.size, 0);

        gunther.clearLastDialog();
        gunther.clearMessages();

        // (2) Request an increase without having available bots.
        gunther.respondToDialog({ listitem: 2 /* Request an increase in bots... */ }).then(
            () => gunther.respondToDialog({ response: 1 /* Dismiss */ }));

        await gunther.issueCommand('/nuwani');

        assert.equal(gunther.messages.length, 0);
        assert.equal(nuwani.runtime.availableBots.size, 0);

        gunther.clearLastDialog();

        // (3) Request a decrease having optional, active bots.
        gunther.respondToDialog({ listitem: 3 /* Request a decrease in bots... */ }).then(
            () => gunther.respondToDialog({ response: 1 /* Confirm */ })).then(
            () => gunther.respondToDialog({ response: 0 /* Dismiss */ }));

        await gunther.issueCommand('/nuwani');

        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], Message.format(Message.NUWANI_ADMIN_DECREASE_BOT,
                                                            gunther.name, gunther.id));

        assert.equal(nuwani.runtime.availableBots.size, 1);

        gunther.clearLastDialog();
        gunther.clearMessages();

        // (4) Request a decrease without having optional, active bots.
        gunther.respondToDialog({ listitem: 3 /* Request a decrease in bots... */ }).then(
            () => gunther.respondToDialog({ response: 1 /* Dismiss */ }));

        await gunther.issueCommand('/nuwani');

        assert.equal(gunther.messages.length, 0);
        assert.equal(nuwani.runtime.availableBots.size, 1);
    });

    it('should be able to cancel changes in active bots', async (assert) => {
        assert.equal(nuwani.runtime.availableBots.size, 1);
        
        // (1) Request an increase in the number of available bots.
        gunther.respondToDialog({ listitem: 2 /* Request an increase in bots... */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Cancel */ }));

        await gunther.issueCommand('/nuwani');

        assert.equal(nuwani.runtime.availableBots.size, 1);

        nuwani.runtime.requestSlaveIncrease();
        assert.equal(nuwani.runtime.availableBots.size, 0);

        // (2) Request a decrease in the number of available bots.
        gunther.respondToDialog({ listitem: 3 /* Request a decrease in bots... */ }).then(
            () => gunther.respondToDialog({ response: 0 /* Cancel */ }));

        await gunther.issueCommand('/nuwani');

        assert.equal(nuwani.runtime.availableBots.size, 0);
    });
});
