// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('PlaygroundPermissionDelegate', (it, beforeEach) => {
    let delegate = null;
    let gunther = null;

    beforeEach(() => {
        const feature = server.featureManager.loadFeature('playground');

        delegate = feature.permissionDelegate_;
        gunther = server.playerManager.getById(/* Gunther= */ 0);
    });

    it('should enable command levels to be changed at runtime', async (assert) => {
        await gunther.identify();

        server.commandManager.buildCommand('test')
            .description('This is a testing command.')
            .restrict(Player.LEVEL_ADMINISTRATOR)
            .sub('subcommand')
                .description('Sub-command restricted to Management.')
                .restrict(Player.LEVEL_MANAGEMENT)
                .build(() => 1)
            .build(() => 1);

        const command = server.commandManager.resolveCommand('/test');
        const subCommand = server.commandManager.resolveCommand('/test subcommand');

        // (1) Gunther, as a player, shouldn't be able to execute either command.
        assert.isFalse(delegate.canExecuteCommand(gunther, null, command, /* verbose= */ false));
        assert.isFalse(delegate.canExecuteCommand(gunther, null, subCommand, /* verbose= */ false));

        // (2) When the level of |command| has been changed to Player, it should work for him.
        delegate.setCommandLevel(command, Player.LEVEL_PLAYER);

        assert.isTrue(delegate.canExecuteCommand(gunther, null, command, /* verbose= */ false));
        assert.isFalse(delegate.canExecuteCommand(gunther, null, subCommand, /* verbose= */ false));

        // (3) With an exception granted for the |subCommand|, that should be available too.
        assert.isFalse(delegate.hasException(gunther, subCommand));

        delegate.addException(gunther, subCommand);

        assert.isTrue(delegate.hasException(gunther, subCommand));
        assert.isTrue(delegate.canExecuteCommand(gunther, null, command, /* verbose= */ false));
        assert.isTrue(delegate.canExecuteCommand(gunther, null, subCommand, /* verbose= */ false));

        // (4) Iterating over the exceptions for the given |subCommand| should reveal |gunther|.
        assert.includes(delegate.getExceptions(subCommand), gunther);
    });
});
