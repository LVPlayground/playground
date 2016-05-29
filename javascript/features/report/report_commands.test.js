// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const MockAnnounce = require('features/announce/test/mock_announce.js');
const MockDate = require('features/report/test/mock_date.js');
const ReportCommands = require('features/report/report_commands.js');

describe('ReportCommands', (it, beforeEach, afterEach) => {
    let reportCommands = null;

    let mockDate = null;

    beforeEach(() => {
        mockDate = new MockDate();
        reportCommands = new ReportCommands(new MockAnnounce(), mockDate);
    });

    afterEach(() => {
        reportCommands.dispose();
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

        mockDate.setNow(1);
        assert.isTrue(russell.issueCommand('/report 0 bullet-amount freezed'));
        mockDate.setNow(55000);
        assert.isTrue(lucy.issueCommand('/report 0 weird weapon-use'));

        assert.equal(lucy.messages.length, 1);
        assert.equal(lucy.messages[0],
            Message.format(Message.REPORT_ALREADY_REPORTED, gunther.name));
    });

    it('should show a message to an other player if the reported player is reported more than 60' +
        ' seconds ago', assert => {
        const gunther = server.playerManager.getById(0 /* Gunther */);
        const russell = server.playerManager.getById(1 /* Russell */);
        const lucy    = server.playerManager.getById(2 /* Lucy    */);

        mockDate.setNow(1);
        assert.isTrue(russell.issueCommand('/report 0 bullet-amount freezed'));
        mockDate.setNow(65000);
        assert.isTrue(lucy.issueCommand('/report 0 weird weapon-use'));

        assert.equal(lucy.messages.length, 1);
        assert.equal(lucy.messages[0],
            Message.format(Message.REPORT_MESSAGE, gunther.name, gunther.id, 'weird weapon-use'));
    });
});
