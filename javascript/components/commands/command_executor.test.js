// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CommandBuilder } from 'components/commands/command_builder.js';
import { CommandContextDelegate } from 'components/commands/command_context_delegate.js';
import { CommandExecutor } from 'components/commands/command_executor.js';
import { CommandKey } from 'components/commands/command_key.js';
import { CommandParameter } from 'components/commands/command_parameter.js';
import { CommandPermissionDelegate } from 'components/commands/command_permission_delegate.js';

describe('CommandExecutor', (it, beforeEach) => {
    let contextDelegate = null;
    let permissionDelegate = null;

    let command = null;
    let executor = null;
    let gunther = null;

    beforeEach(() => {
        // Implementation of the context delegate specifically written for this test.
        contextDelegate = new class extends CommandContextDelegate {

        };

        // Implementation of the permission delegate specifically written for this test.
        permissionDelegate = new class extends CommandPermissionDelegate {

        };

        command = null;
        executor = new CommandExecutor(contextDelegate, permissionDelegate);
        gunther = server.playerManager.getById(/* Gunther= */ 1);
    });

    // Helper function to start creating a command builder that will write the resulting description
    // to the test-local |description| variable.
    function buildCommand(name) {
        return new CommandBuilder({
            listener: description => command = description,
            name: name,
            prefix: '/',
        });
    }

    it('should be able to execute basic commands with parameters', assert => {
        let executed = false;

        buildCommand('test')
            .description('This is a test command')
            .build(() => executed = true);

        executor.executeCommand(gunther, command, '');

        assert.isTrue(executed);
    });

    it('should be able to transform the immutable objects to strings', assert => {
        assert.equal('foo', new CommandKey({
            name: 'foo',
            optional: false,
            type: CommandParameter.kTypeText,
            value: 'foo'
        }));

        assert.equal('[foo]', new CommandKey({
            name: 'foo',
            optional: false,
            type: CommandParameter.kTypeNumber,
            value: null,
        }));

        assert.equal('[foo=you]', new CommandKey({
            name: 'foo',
            optional: true,
            type: CommandParameter.kTypePlayer,
            value: null,
        }));

        assert.equal('[foo]', new CommandParameter({
            name: 'foo',
            optional: false,
            defaultValue: null,
            type: CommandParameter.kTypeNumber,
        }));

        assert.equal('[foo=5]', new CommandParameter({
            name: 'foo',
            optional: false,
            defaultValue: 5,
            type: CommandParameter.kTypeNumber,
        }));

        assert.equal('[foo]?', new CommandParameter({
            name: 'foo',
            optional: true,
            defaultValue: null,
            type: CommandParameter.kTypeNumber,
        }));
    });
});
