// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import MockPlaygroundCommands from 'features/playground/test/mock_playground_commands.js';

describe('AutoHello', (it, beforeEach, afterEach) => {
    let commands = null;
    let gunther = null;

    beforeEach(async() => {
        commands = new MockPlaygroundCommands();
        await commands.loadCommands();

        gunther = server.playerManager.getById(0 /* Gunther */);
        await gunther.identify();

        // Enable |gunther| to use the command by adding an exception.
        commands.access.addException('autohello', gunther);
    });

    afterEach(() => commands.dispose());

    it('should function like a toggle on the greeter feature', async(assert) => {
        assert.isTrue(await gunther.issueCommand('/autohello'));

        assert.equal(gunther.messages.length, 1);
        assert.isTrue(gunther.messages[0].includes('will now welcome players'));

        gunther.clearMessages();

        assert.isTrue(await gunther.issueCommand('/autohello'));

        assert.equal(gunther.messages.length, 1);
        assert.isTrue(gunther.messages[0].includes('will stop being nice'));
    });

    it('should welcome players who log in to the server', async(assert) => {
        assert.isTrue(await gunther.issueCommand('/autohello'));

        server.playerManager.onPlayerConnect({
            playerid: 100,
            name: 'Joe'
        });

        const joe = server.playerManager.getById(100 /* Joe */);
        assert.isNotNull(joe);

        assert.equal(joe.messages.length, 0);

        await joe.identify({ userId: 5001 });

        await server.clock.advance(10 * 60 * 1000);  // maximum delay of the welcome message

        assert.equal(joe.messages.length, 1);
        assert.isTrue(joe.messages[0].includes(joe.name));
    });

    it('should be clever about players who reconnect to the server', async(assert) => {
        assert.isTrue(await gunther.issueCommand('/autohello'));

        server.playerManager.onPlayerConnect({
            playerid: 100,
            name: 'Joe'
        });

        const joe = server.playerManager.getById(100 /* Joe */);
        assert.isNotNull(joe);

        assert.equal(joe.messages.length, 0);

        await joe.identify({ userId: 5001 });

        await server.clock.advance(10 * 60 * 1000);  // maximum delay of the welcome message

        assert.equal(joe.messages.length, 1);
        assert.isTrue(joe.messages[0].includes(joe.name));

        joe.disconnectForTesting();

        server.playerManager.onPlayerConnect({
            playerid: 200,
            name: 'Joseph'
        });

        const joseph = server.playerManager.getById(200 /* Joseph */);
        assert.isNotNull(joseph);

        assert.equal(joseph.messages.length, 0);

        await joseph.identify({ userId: 5001 });

        await server.clock.advance(10 * 60 * 1000);  // maximum delay of the welcome message

        assert.equal(joseph.messages.length, 1);
        assert.isTrue(joseph.messages[0].includes('wb'));
        assert.isTrue(joseph.messages[0].includes(joseph.name));
    });
});
