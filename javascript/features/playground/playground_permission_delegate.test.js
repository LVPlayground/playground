// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { kExceptionExpirationTimeMs } from 'features/playground/playground_permission_delegate.js';

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

        gunther.level = Player.LEVEL_ADMINISTRATOR;
        gunther.levelIsTemporary = true;

        server.commandManager.buildCommand('test')
            .description('This is a testing command.')
            .restrict(Player.LEVEL_MANAGEMENT)
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

        // (2) When the level of |command| has been changed to Player, it should work for them.
        delegate.setCommandLevel(command, Player.LEVEL_ADMINISTRATOR);

        assert.isTrue(delegate.canExecuteCommand(gunther, null, command, /* verbose= */ false));
        assert.isFalse(delegate.canExecuteCommand(gunther, null, subCommand, /* verbose= */ false));

        // (3) If the level of |command| is administrator, and restricted from players with
        // temporary rights, the access should be removed from |gunther| again.
        delegate.setCommandLevel(command, Player.LEVEL_ADMINISTRATOR, true);

        assert.isFalse(delegate.canExecuteCommand(gunther, null, command, /* verbose= */ false));
        assert.isFalse(delegate.canExecuteCommand(gunther, null, subCommand, /* verbose= */ false));

        // --- reset it again, so that the rest of the test works as expected
        delegate.setCommandLevel(command, Player.LEVEL_ADMINISTRATOR, false);

        // (3) With an exception granted for the |subCommand|, that should be available too.
        assert.isFalse(delegate.hasException(gunther, subCommand));

        delegate.addException(gunther, subCommand);

        assert.isTrue(delegate.hasException(gunther, subCommand));
        assert.isTrue(delegate.canExecuteCommand(gunther, null, command, /* verbose= */ false));
        assert.isTrue(delegate.canExecuteCommand(gunther, null, subCommand, /* verbose= */ false));

        // (4) Iterating over the exceptions for the given |subCommand| should reveal |gunther|.
        assert.includes(delegate.getExceptions(subCommand), gunther);
    });

    it('should automatically restore exceptions on reconnection', async (assert) => {
        await gunther.identify({ userId: 123 });

        server.commandManager.buildCommand('test')
            .description('This is a testing command.')
            .restrict(Player.LEVEL_MANAGEMENT)
            .build(() => 1);

        const command = server.commandManager.resolveCommand('/test');

        // (1) Make sure that |gunther| cannot use the |command| yet.
        assert.isFalse(delegate.canExecuteCommand(gunther, null, command, /* verbose= */ false));

        // (2) Grant an exception. |gunther| should now be able to use the |command|.
        delegate.addException(gunther, command);

        assert.isTrue(delegate.canExecuteCommand(gunther, null, command, /* verbose= */ false));

        // (3) Disconnect |gunther|. The ability to execute the command should go away.
        gunther.disconnectForTesting();

        assert.isFalse(gunther.isConnected());
        assert.isFalse(delegate.canExecuteCommand(gunther, null, command, /* verbose= */ false));

        // (4) Reconnect |gunther| with another player Id. They shouldn't yet be able to access it.
        server.playerManager.onPlayerConnect({
            playerid: 42,
            nickname: 'Guntah',
        });

        const guntah = server.playerManager.getById(/* Guntah= */ 42);
        assert.isNotNull(guntah);

        assert.isFalse(delegate.canExecuteCommand(guntah, null, command, /* verbose= */ false));

        // (5) Have |guntah| identify to the same account as |gunther|. This will grant them access.
        await guntah.identify({ userId: 123 });

        assert.isTrue(delegate.canExecuteCommand(guntah, null, command, /* verbose= */ false));

        // (6) Disconnect |guntah| from the server as well.
        guntah.disconnectForTesting();

        assert.isFalse(guntah.isConnected());
        assert.isFalse(delegate.canExecuteCommand(guntah, null, command, /* verbose= */ false));

        // (7) Wait until the |kExceptionExpirationTimeMs| has expired, then reconnect them.
        await server.clock.advance(kExceptionExpirationTimeMs + 1);

        server.playerManager.onPlayerConnect({
            playerid: 102,
            nickname: 'GunTR',
        });

        const guntr = server.playerManager.getById(/* GunTR= */ 102);
        assert.isNotNull(guntr);

        assert.isFalse(delegate.canExecuteCommand(guntr, null, command, /* verbose= */ false));

        // (8) Upon identification, access should *not* be regranted to |guntr|, as it expired.
        await guntr.identify({ userId: 123 });

        assert.isFalse(delegate.canExecuteCommand(guntr, null, command, /* verbose= */ false));
    });
});
