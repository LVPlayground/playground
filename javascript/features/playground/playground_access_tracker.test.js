// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import PlaygroundAccessTracker from 'features/playground/playground_access_tracker.js';

describe('PlaygroundAccessTracker', (it, beforeEach, afterEach) => {
    let tracker = null;

    beforeEach(() => tracker = new PlaygroundAccessTracker());
    afterEach(() => tracker.dispose());

    it('should be able to determine whether a player can use a command', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        await gunther.identify();

        tracker.registerCommand('foo', Player.LEVEL_MANAGEMENT);

        assert.isFalse(tracker.canAccessCommand('foo', gunther));

        // Allow access based on player level.
        gunther.level = Player.LEVEL_MANAGEMENT;
        assert.isTrue(tracker.canAccessCommand('foo', gunther));

        gunther.level = Player.LEVEL_ADMINISTRATOR;
        assert.isFalse(tracker.canAccessCommand('foo', gunther));

        // Allow access based on command exception.
        tracker.addException('foo', gunther);
        assert.isTrue(tracker.canAccessCommand('foo', gunther));

        tracker.removeException('foo', gunther);
        assert.isFalse(tracker.canAccessCommand('foo', gunther));
    });

    it('should only allow level-based operations for registered commands', assert => {
        assert.throws(() => tracker.getCommandLevel('foo'));
        assert.throws(() => tracker.setCommandLevel('foo', Player.LEVEL_MANAGEMENT));

        tracker.registerCommand('foo', Player.LEVEL_ADMINISTRATOR);

        assert.equal(tracker.getCommandLevel('foo'), Player.LEVEL_ADMINISTRATOR);

        tracker.setCommandLevel('foo', Player.LEVEL_MANAGEMENT);

        assert.equal(tracker.getCommandLevel('foo'), Player.LEVEL_MANAGEMENT);
    });

    it('should only allow exceptions for registered players', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        assert.isFalse(gunther.isRegistered());

        tracker.registerCommand('foo', Player.LEVEL_MANAGEMENT);

        assert.isFalse(tracker.canAccessCommand('foo', gunther));

        assert.throws(() => tracker.addException('foo', gunther));
        assert.throws(() => tracker.removeException('foo', gunther));

        assert.isFalse(tracker.hasException('foo', gunther));

        await gunther.identify();

        assert.isFalse(tracker.canAccessCommand('foo', gunther));

        assert.doesNotThrow(() => tracker.addException('foo', gunther));

        assert.isTrue(tracker.canAccessCommand('foo', gunther));
        assert.isTrue(tracker.hasException('foo', gunther));

        assert.doesNotThrow(() => tracker.removeException('foo', gunther));

        assert.isFalse(tracker.canAccessCommand('foo', gunther));
    });

    it('should only allow exceptions for existing commands', async (assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        await gunther.identify();

        assert.isTrue(gunther.isRegistered());

        assert.throws(() => tracker.canAccessCommand('foo', gunther));
        assert.throws(() => tracker.addException('foo', gunther));
        assert.throws(() => tracker.hasException('foo', gunther));
        assert.throws(() => tracker.removeException('foo', gunther));

        tracker.registerCommand('foo', Player.LEVEL_MANAGEMENT);

        assert.doesNotThrow(() => tracker.addException('foo', gunther));

        assert.isTrue(tracker.canAccessCommand('foo', gunther));
        assert.isTrue(tracker.hasException('foo', gunther));

        assert.doesNotThrow(() => tracker.removeException('foo', gunther));

        assert.isFalse(tracker.canAccessCommand('foo', gunther));
    });

    it('should remove exceptions on disconnect, and restore on reconnect', async(assert) => {
        const gunther1 = server.playerManager.getById(0 /* Gunther */);
        const gunther2 = server.playerManager.getById(1 /* Russell, will identify as Gunther */);
        const gunther3 = server.playerManager.getById(2 /* Lucy, will identify as Gunther */);

        await gunther1.identify({ userId: 144 });
        assert.isTrue(gunther1.isRegistered());

        tracker.registerCommand('foo', Player.LEVEL_MANAGEMENT);
        tracker.addException('foo', gunther1);

        assert.equal(tracker.getExceptionCount('foo'), 1);
        assert.isTrue(tracker.canAccessCommand('foo', gunther1));

        gunther1.disconnectForTesting();

        assert.equal(tracker.getExceptionCount('foo'), 0);
        assert.isFalse(tracker.canAccessCommand('foo', gunther1));
        assert.isFalse(tracker.canAccessCommand('foo', gunther2));

        await gunther2.identify({ userId: 144 });
        assert.isTrue(gunther2.isRegistered());

        // The exception should have been re-granted for userId = 144.
        assert.isTrue(tracker.canAccessCommand('foo', gunther2));
        assert.equal(tracker.getExceptionCount('foo'), 1);

        gunther2.disconnectForTesting();

        assert.equal(tracker.getExceptionCount('foo'), 0);

        // The restoration feature expires after five minutes. Verify that as well.
        await server.clock.advance(5 * 60 * 1000);

        await gunther3.identify({ userId: 144 });
        assert.isTrue(gunther3.isRegistered());

        // The exception should *not* have been re-granted for userId = 144.
        assert.isFalse(tracker.canAccessCommand('foo', gunther3));
        assert.equal(tracker.getExceptionCount('foo'), 0);
    });
});
