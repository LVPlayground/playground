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
    let allowed = true;

    let contextDelegate = null;
    let permissionDelegate = null;

    let command = null;
    let executor = null;
    let gunther = null;

    beforeEach(() => {
        allowed = true;

        // Implementation of the context delegate specifically written for this test.
        contextDelegate = new class extends CommandContextDelegate {
            respondWithUsage(context, command) {
                context.sendMessage(command.toString());
            }
        };

        // Implementation of the permission delegate specifically written for this test.
        permissionDelegate = new class extends CommandPermissionDelegate {
            canExecuteCommand(context, contextDelegate, command) {
                return allowed;  // change |allowed| to block execution
            }
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

    it('should be able to execute basic commands with parameters', async (assert) => {
        let counter = 0;

        // (1) Execute the command without changing the defaults. This should work.
        buildCommand('test')
            .description('This is a test command')
            .build(() => counter++);

        assert.isDefined(await executor.executeCommand(gunther, command, ''));
        assert.equal(counter, 1);

        // (2) Execute the command without permission being granted. This should fail.
        allowed = false;

        assert.isFalse(await executor.executeCommand(gunther, command, ''));
        assert.equal(counter, 1);
    });

    it('should be able to execute complex commands with sub-commands', async (assert) => {
        let value = 0;

        buildCommand('test')
            .description('This is a test command')
            .sub('banana')
                .description('This one has a banana')
                .build(() => value = 1)
            .sub('pineapple')
                .description('This one has a pineapple')
                .build(() => value = 2)
            .sub(CommandBuilder.kTypeText, 'fruit')
                .description('This one is for all fruits')
                .build(() => value = 3)
            .build(() => value = 4);

        assert.isDefined(await executor.executeCommand(gunther, command, ''));
        assert.equal(value, 4);

        assert.isDefined(await executor.executeCommand(gunther, command, 'pineapple'));
        assert.equal(value, 2);

        assert.isDefined(await executor.executeCommand(gunther, command, 'banana'));
        assert.equal(value, 1);

        assert.isDefined(await executor.executeCommand(gunther, command, 'kiwi'));
        assert.equal(value, 3);
    });

    it('should be able to execute complex commands with parameters', async (assert) => {
        let fruit = null;
        let brand = null;
        let number = null;

        buildCommand('test')
            .description('This is a test command')
            .sub('banana')
                .description('This one has a banana')
                .parameters([
                    { name: 'brand', type: CommandBuilder.kTypeText },
                    { name: 'number', type: CommandBuilder.kTypeNumber, defaultValue: 1 },
                ])
                .build((player, inBrand, inNumber) => {
                    brand = inBrand;
                    number = inNumber;
                    return true;
                })
            .sub(CommandBuilder.kTypeText, 'fruit')
                .description('This one is for all fruits')
                .parameters([
                    { name: 'brand', type: CommandBuilder.kTypeText },
                    { name: 'number', type: CommandBuilder.kTypeNumber, defaultValue: 1 },
                ])
                .build((player, inFruit, inBrand, inNumber) => {
                    fruit = inFruit;
                    brand = inBrand;
                    number = inNumber;
                    return true;
                })
            .build(() => true);

        assert.isDefined(await executor.executeCommand(gunther, command, ''));
        assert.isNull(fruit);
        assert.isNull(brand);
        assert.isNull(number);

        assert.isDefined(await executor.executeCommand(gunther, command, 'banana'));
        assert.isNull(fruit);
        assert.isNull(brand);
        assert.isNull(number);

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], '/test banana [brand] [number=1]');

        assert.isDefined(await executor.executeCommand(gunther, command, 'kiwi'));
        assert.isNull(fruit);
        assert.isNull(brand);
        assert.isNull(number);

        assert.equal(gunther.messages.length, 2);
        assert.equal(gunther.messages[1], '/test [fruit] [brand] [number=1]');

        assert.isDefined(await executor.executeCommand(gunther, command, 'banana chiquita'));
        assert.isNull(fruit);
        assert.equal(brand, 'chiquita');
        assert.equal(number, 1);

        assert.isDefined(await executor.executeCommand(gunther, command, 'banana befrank 2'));
        assert.isNull(fruit);
        assert.equal(brand, 'befrank');
        assert.equal(number, 2);

        assert.isDefined(await executor.executeCommand(gunther, command, 'kiwi zespri'));
        assert.equal(fruit, 'kiwi');
        assert.equal(brand, 'zespri');
        assert.equal(number, 1);
    });

    it('is able to read data in various formats from the command text', assert => {
        assert.isNull(executor.readNumber(''));
        assert.isNull(executor.readNumber('banana'));
        assert.isNull(executor.readNumber('{51}'));

        assert.isNull(executor.readText(''));

        // Section: reading numbers
        assert.deepEqual(executor.readNumber('21'), { match: '21', value: 21 });
        assert.deepEqual(executor.readNumber('-21'), { match: '-21', value: -21 });
        assert.deepEqual(executor.readNumber('21 '), { match: '21 ', value: 21 });
        assert.deepEqual(executor.readNumber('-21 '), { match: '-21 ', value: -21 });
        assert.deepEqual(executor.readNumber('21 banana'), { match: '21 ', value: 21 });
        assert.deepEqual(executor.readNumber('-21 banana'), { match: '-21 ', value: -21 });

        assert.deepEqual(executor.readNumber('12.34'), { match: '12.34', value: 12.34 });
        assert.deepEqual(executor.readNumber('-12.34'), { match: '-12.34', value: -12.34 });
        assert.deepEqual(executor.readNumber('12.34 '), { match: '12.34 ', value: 12.34 });
        assert.deepEqual(executor.readNumber('-12.34 '), { match: '-12.34 ', value: -12.34 });
        assert.deepEqual(executor.readNumber('12.34 banana'), { match: '12.34 ', value: 12.34 });
        assert.deepEqual(executor.readNumber('-12.34 banana'), { match: '-12.34 ', value: -12.34 });

        assert.deepEqual(executor.readNumber('0x80'), { match: '0x80', value: 128 });
        assert.deepEqual(executor.readNumber('0X80'), { match: '0X80', value: 128 });
        assert.deepEqual(executor.readNumber('0x80 '), { match: '0x80 ', value: 128 });
        assert.deepEqual(executor.readNumber('0X80 '), { match: '0X80 ', value: 128 });
        assert.deepEqual(executor.readNumber('0x80 banana'), { match: '0x80 ', value: 128 });
        assert.deepEqual(executor.readNumber('0X80 banana'), { match: '0X80 ', value: 128 });

        // Section: reading text
        assert.deepEqual(executor.readText('21'), { match: '21', value: '21' });
        assert.deepEqual(executor.readText('21 '), { match: '21 ', value: '21' });
        assert.deepEqual(executor.readText('21 banana'), { match: '21 ', value: '21' });

        assert.deepEqual(executor.readText('banana'), { match: 'banana', value: 'banana' });
        assert.deepEqual(executor.readText('banana phone'), { match: 'banana ', value: 'banana' });

        assert.deepEqual(executor.readText('127.0 phone'), { match: '127.0 ', value: '127.0' });

        // Section: reading players
        assert.deepEqual(executor.readPlayer('0'), { match: '0', value: gunther });
        assert.deepEqual(executor.readPlayer('0 '), { match: '0 ', value: gunther });
        assert.deepEqual(executor.readPlayer('0 banana'), { match: '0 ', value: gunther });

        assert.deepEqual(executor.readPlayer('gunt'), { match: 'gunt', value: gunther });
        assert.deepEqual(executor.readPlayer('gunt '), { match: 'gunt ', value: gunther });
        assert.deepEqual(executor.readPlayer('gunt banana'), { match: 'gunt ', value: gunther });

        assert.deepEqual(executor.readPlayer('Gunther'), { match: 'Gunther', value: gunther });
        assert.deepEqual(executor.readPlayer('Gunther '), { match: 'Gunther ', value: gunther });
        assert.deepEqual(executor.readPlayer('Gunther ya'), { match: 'Gunther ', value: gunther });
    });

    it('should be able to transform the immutable objects to strings', assert => {
        assert.equal(
            'foo', new CommandKey('foo', /* optional= */ false, CommandParameter.kTypeText, 'foo'));

        assert.equal(
            '[foo]', new CommandKey('foo', /* optional= */ false, CommandParameter.kTypeNumber));

        assert.equal(
            '[foo=you]', new CommandKey('foo', /* optional= */ true, CommandParameter.kTypePlayer));

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
