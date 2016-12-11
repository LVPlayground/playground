// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const Economy = require('features/economy/economy.js');
const MockAnnounce = require('features/announce/test/mock_announce.js');
const Killtime = require('features/killtime/killtime.js');
const KilltimeCommands = require('features/killtime/killtime_commands.js');
const KilltimeManager = require('features/killtime/killtime_manager.js');

describe('Killtime', (it, beforeEach) => {
    let killtime = null;

    beforeEach(() => {
        server.featureManager.registerFeaturesForTests({
            announce: MockAnnounce,
            economy: Economy,
            killtime: Killtime,
            ktManager: KilltimeManager,
            ktCommands: KilltimeCommands
        });

        server.featureManager.loadFeature('killtime');
    });

    it('should register a kill 1 second before the minutely announceTopKiller', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        const amountOfKillsByGunther = 1;
        const killtimeMessage = Message.format(
            Message.KILLTIME_TOPKILLER, gunther.name + ' with ' + amountOfKillsByGunther + ' kills', 25000);

        russell.identify();
        russell.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(russell.issueCommand('/killtime start'));
        russell.clearMessages();

        await server.clock.advance(59 * 1000);
        russell.die(gunther);
        await server.clock.advance(2 * 1000);

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0],
            Message.format(Message.ANNOUNCE_ALL, killtimeMessage));
    });

    it('should be able to be started for 3 minutes by a registered administrator', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const minutesToRun = 3;
        const killtimeMessage = Message.format(Message.KILLTIME_STARTED, minutesToRun);

        gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(gunther.issueCommand('/killtime start ' + minutesToRun));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
            Message.format(Message.ANNOUNCE_ALL, killtimeMessage));
    });

    it('should show the usage for administrators without any parameters', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(gunther.issueCommand('/killtime'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0],
            Message.format(Message.COMMAND_USAGE, Message.KILLTIME_USAGE));
    });

    it('should show that at a manual stop it is stopped by an administrator without a winner', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);

        gunther.identify();
        gunther.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(gunther.issueCommand('/killtime start'));
        gunther.clearMessages();
        assert.isTrue(gunther.issueCommand('/killtime stop'));

        assert.equal(gunther.messages.length, 2);
        assert.equal(gunther.messages[0],
            Message.format(Message.ANNOUNCE_ALL, Message.KILLTIME_ADMIN_STOPPED));
        assert.equal(gunther.messages[1],
            Message.format(Message.ANNOUNCE_ALL, Message.format(Message.KILLTIME_WINNER, 'no-one', '')));
    });

    it('should support live reloading, and properly clean up after itself', assert => {
        const commandCount = server.commandManager.size;

        assert.isTrue(server.featureManager.isEligibleForLiveReload('killtime'));
        assert.isTrue(server.featureManager.liveReload('killtime'));

        assert.equal(server.commandManager.size, commandCount);
    });
});
