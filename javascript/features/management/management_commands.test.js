// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ManagementCommands = require('features/management/management_commands.js');

describe('ManagementCommands', (it, beforeEach, afterEach) => {
    let commands = null;

    beforeEach(() => commands = new ManagementCommands());
    afterEach(() => {
        if (commands)
            commands.dispose();
    });

    it('should enable players to be added and removed from the access list', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        assert.isFalse(commands.hasAccess(gunther));

        gunther.level = Player.LEVEL_MANAGEMENT;

        assert.isTrue(commands.hasAccess(gunther));
        assert.isFalse(commands.hasAccess(russell));

        assert.isTrue(await gunther.issueCommand('/mallow ' + russell.name));
        assert.isTrue(commands.hasAccess(russell));

        assert.isTrue(await russell.issueCommand('/mdeny ' + gunther.name));
        assert.isTrue(commands.hasAccess(gunther));

        assert.isTrue(await gunther.issueCommand('/mdeny ' + russell.name));
        assert.isFalse(commands.hasAccess(russell));
    });

    it('should enable players on the access list to be listed', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        gunther.level = Player.LEVEL_MANAGEMENT;

        assert.isTrue(commands.hasAccess(gunther));
        assert.isTrue(await gunther.issueCommand('/mallow ' + russell.name));
        assert.isTrue(commands.hasAccess(russell));

        gunther.clearMessages();

        assert.isTrue(await gunther.issueCommand('/mallow'));

        assert.equal(gunther.messages.length, 2);
        assert.equal(gunther.messages[0], Message.MANAGEMENT_ACCESS_HEADER);
        assert.isTrue(gunther.messages[1].includes(russell.name));
    });

    it('should remove players from the access list when they disconnect', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        gunther.level = Player.LEVEL_MANAGEMENT;

        assert.isTrue(commands.hasAccess(gunther));
        assert.isTrue(await gunther.issueCommand('/mallow ' + russell.name));
        assert.isTrue(commands.hasAccess(russell));

        russell.disconnect();

        assert.isFalse(commands.hasAccess(russell));
    });
});
