// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

describe('CommunicationManager', (it, beforeEach, afterEach) => {
    let gunther = null;
    let manager = null;

    beforeEach(() => {
        const communication = server.featureManager.loadFeature('communication');

        gunther = server.playerManager.getById(0 /* Gunther */);
        manager = communication.manager_;
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



    it.fails();
});
