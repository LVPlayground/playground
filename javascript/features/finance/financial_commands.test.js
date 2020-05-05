// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('FinancialCommands', (it, beforeEach) => {
    let gunther = null;
    let lucy = null;

    beforeEach(() => {
        server.featureManager.loadFeature('finance');

        gunther = server.playerManager.getById(/* Gunther= */ 0);

        lucy = server.playerManager.getById(/* Lucy= */ 2);
        lucy.identify();
    });

    it('should limit bank account-related commands to registered players', async (assert) => {
        assert.isTrue(await gunther.issueCommand('/balance'));
        assert.equal(gunther.messages.length, 1);
        assert.includes(gunther.messages[0], Message.format(Message.BANK_NEED_ACCOUNT));

        assert.isTrue(await gunther.issueCommand('/bank 12345'));
        assert.equal(gunther.messages.length, 2);
        assert.includes(gunther.messages[1], Message.format(Message.BANK_NEED_ACCOUNT));
        
        assert.isTrue(await gunther.issueCommand('/withdraw 12345'));
        assert.equal(gunther.messages.length, 3);
        assert.includes(gunther.messages[2], Message.format(Message.BANK_NEED_ACCOUNT));
    });
});
