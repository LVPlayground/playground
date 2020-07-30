// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Report from 'features/report/report.js';

describe('Report', (it, beforeEach) => {
    let report = null;

    beforeEach(() => {
        server.featureManager.registerFeaturesForTests({
            report: Report
        });

        server.featureManager.loadFeature('report');
    });

    it('should report a player to the admins', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        const lucy    = server.playerManager.getById(2 /* Lucy */);

        russell.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(lucy.issueCommand('/report 0 health freezed'));

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0],
            Message.format(Message.ANNOUNCE_REPORT, lucy.name, lucy.id, gunther.name, gunther.id,
                           'health freezed'));
    });

    it('should show a message back to the player who reports a player', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        assert.isTrue(russell.issueCommand('/report 0 bullet-amount freezed'));

        assert.equal(russell.messages.length, 1);
        assert.equal(russell.messages[0],
            Message.format(Message.REPORT_MESSAGE, gunther.name, gunther.id,
                           'bullet-amount freezed'));
    });

    it('should show a message back to only non-administrators about report-delivery', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);

        russell.level = Player.LEVEL_ADMINISTRATOR;

        assert.isTrue(russell.issueCommand('/report 0 bullet-amount freezed'));

        assert.equal(russell.messages.length, 1);
        assert.notEqual(russell.messages[0],
            Message.format(Message.REPORT_MESSAGE, gunther.name, gunther.id,
                           'bullet-amount freezed'));
    });

    it('should show an error to an other player if the reported player is reported less than 60' +
        ' seconds ago', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        const lucy    = server.playerManager.getById(2 /* Lucy    */);

        assert.isTrue(russell.issueCommand('/report 0 bullet-amount freezed'));
        assert.isTrue(lucy.issueCommand('/report 0 weird weapon-use'));

        assert.equal(lucy.messages.length, 1);
        assert.equal(lucy.messages[0],
            Message.format(Message.REPORT_ALREADY_REPORTED, gunther.name));
    });

    it('should show a message to an other player if the reported player is reported more than 60' +
        ' seconds ago', async(assert) => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        const lucy    = server.playerManager.getById(2 /* Lucy    */);

        assert.isTrue(russell.issueCommand('/report 0 bullet-amount freezed'));

        // Advance the server's time by two minutes to fake the wait having passed.
        await server.clock.advance(120000);

        assert.isTrue(lucy.issueCommand('/report 0 weird weapon-use'));

        assert.equal(lucy.messages.length, 1);
        assert.equal(lucy.messages[0],
            Message.format(Message.REPORT_MESSAGE, gunther.name, gunther.id, 'weird weapon-use'));
    });

    it('should support live reloading, and properly clean up after itself', async assert => {
        const commandCount = server.deprecatedCommandManager.size;

        assert.isTrue(server.featureManager.isEligibleForLiveReload('report'));
        assert.isTrue(await server.featureManager.liveReload('report'));

        assert.equal(server.deprecatedCommandManager.size, commandCount);
    });
});
