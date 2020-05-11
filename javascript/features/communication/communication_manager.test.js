// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('CommunicationManager', (it, beforeEach, afterEach) => {
    let gunther = null;
    let manager = null;
    let nuwani = null;
    let russell = null;

    beforeEach(() => {
        const communication = server.featureManager.loadFeature('communication');

        gunther = server.playerManager.getById(/* Gunther= */ 0);
        manager = communication.manager_;
        nuwani = server.featureManager.loadFeature('nuwani');
        russell = server.playerManager.getById(/* Russell= */ 1);
    });

    it('should allow delegates to intercept received messages', assert => {
        let invocationCount = 0;

        manager.addDelegate(new class {
            onPlayerText(player, message) {
                invocationCount++;
                return true;  // handled
            }
        });

        manager.addDelegate(new class {
            onPlayerText(player, message) {
                invocationCount++;
                return false;  // not handled
            }
        });

        assert.isTrue(gunther.issueMessage('hello'));
        assert.equal(invocationCount, 1);
    });

    it('should be able to provide administrator chat', assert => {
        
    });

    it('should be able to provide a private VIP chat', assert => {
        assert.isFalse(gunther.isVip());
        assert.isFalse(russell.isVip());

        assert.isTrue(gunther.issueMessage('#Hello!'));

        assert.equal(gunther.messages.length, 1);
        assert.equal(gunther.messages[0], Message.format(Message.COMMUNICATION_VIP_NO_ACCESS));

        assert.equal(russell.messages.length, 0);
        assert.equal(nuwani.messagesForTesting.length, 0);

        gunther.setVip(true);

        assert.isTrue(gunther.issueMessage('#Heya!'));

        assert.equal(gunther.messages.length, 2);
        assert.equal(
            gunther.messages[1],
            Message.format(Message.COMMUNICATION_VIP_MESSAGE, gunther.id, gunther.name, 'Heya!'));

        assert.equal(nuwani.messagesForTesting.length, 1);
        assert.deepEqual(nuwani.messagesForTesting[0], {
            tag: 'chat-vip',
            params: [ gunther.id, gunther.name, 'Heya!' ],
        });

        assert.equal(russell.messages.length, 0);

        russell.setVip(true);

        assert.isTrue(gunther.issueMessage('#Boo!'));

        assert.equal(gunther.messages.length, 3);
        assert.equal(
            gunther.messages[2],
            Message.format(Message.COMMUNICATION_VIP_MESSAGE, gunther.id, gunther.name, 'Boo!'));

        assert.equal(russell.messages.length, 1);
        assert.equal(
            russell.messages[0],
            Message.format(Message.COMMUNICATION_VIP_MESSAGE, gunther.id, gunther.name, 'Boo!'));

        assert.equal(nuwani.messagesForTesting.length, 2);

        russell.syncedData.setIsolated(true);

        assert.isTrue(russell.issueMessage('#Silence'));

        assert.equal(gunther.messages.length, 3); // no change
        assert.equal(russell.messages.length, 2);
        assert.equal(
            russell.messages[1],
            Message.format(Message.COMMUNICATION_VIP_MESSAGE, russell.id, russell.name, 'Silence'));
        
        assert.equal(nuwani.messagesForTesting.length, 2);
    });



    it.fails();
});
