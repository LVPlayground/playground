// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MockPlaygroundCommands = require('features/playground/test/mock_playground_commands.js');

describe('SecretPrivateMessageCommand', (it, beforeEach, afterEach) => {
    let commands = null;
    let lucy = null;

    beforeEach(() => {
        commands = new MockPlaygroundCommands();

        lucy = server.playerManager.getById(2 /* Lucy */);
        lucy.identify();

        // Enable |lucy| to use the command by adding an exception.
        commands.access.addException('spm', lucy);
    });

    afterEach(() => commands.dispose());

    it('should display an error when sending a message to yourself', async(assert) => {
        assert.isTrue(lucy.issueCommand('/spm ' + lucy.name + ' Hi me!'));

        assert.equal(lucy.messages.length, 1);
        assert.isTrue(lucy.messages[0].includes('You cannot send yourself secret messages!'));
    });

    it('should display the message to both players', async(assert) => {
        const russell = server.playerManager.getById(1 /* Russell */);

        assert.isTrue(lucy.issueCommand('/spm ' + russell.name + ' Hi Russell!'));

        assert.equal(lucy.messages.length, 1);
        assert.isTrue(lucy.messages[0].includes('Secret PM to ' + russell.name));

        assert.equal(russell.messages.length, 1);
        assert.isTrue(russell.messages[0].includes('Secret PM from ' + lucy.name));
    });
});
