// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';
import { CommandDescription } from 'components/commands/command_description.js';

describe('CommandBuilder', (it, beforeEach) => {
    let description = null;

    beforeEach(() => description = null);

    // Helper function to start creating a command builder that will write the resulting description
    // to the test-local |description| variable.
    function buildCommand(name) {
        return new CommandBuilder({
            listener: result => description = result,
            name: name,
            prefix: '/',
        });
    }

    // A listener function that can be passed to the build() function, but does nothing.
    function emptyListener() {}

    it('should be able to build description objects for commands', assert => {
        // (1) Build a simple command.
        buildCommand('test')
            .description('This is a test command')
            .build(emptyListener);

        assert.isNotNull(description);
        assert.instanceOf(description, CommandDescription);
        assert.equal(description.command, '/test');
        assert.equal(description.commandName, 'test');
        assert.equal(description.description, 'This is a test command');
        assert.typeOf(description.listener, 'function');
        assert.equal(description.parameters.length, 0);
        assert.equal([ ...description.subs ].length, 0);

        description = null;  // reset

        // (2) Build a more complex command with sub-commands.
        buildCommand('test')
            .description('This is a test command')
            .sub('banana')
                .description('This is a test command for a banana')
                .build(emptyListener)
            .build(emptyListener);

        assert.isNotNull(description);
        assert.instanceOf(description, CommandDescription);
        assert.equal([ ...description.subs ].length, 1);

        {
            const command = [ ...description.subs ][0][1];

            assert.isNotNull(command);
            assert.instanceOf(command, CommandDescription);
            assert.equal(command.command, '/test banana');
            assert.equal(command.commandName, 'banana');
            assert.equal(command.description, 'This is a test command for a banana');
            assert.typeOf(command.listener, 'function');
            assert.equal(command.parameters.length, 0);
            assert.equal([ ...command.subs ].length, 0);
        }

        description = null;  // reset

        // (3) Make sure that commands are not allowed to be ambiguous.
        assert.throws(() => {
            buildCommand('test')
                .description('This is a test command')
                .sub(CommandBuilder.kTypeText, 'fruit')
                    .description('This is a text command for fruits')
                    .build(emptyListener)
                .sub('banana')
                    .description('This is a test command for a banana')
                    .build(emptyListener)
                .build(emptyListener);
        });

        assert.isNull(description);
    });
});
