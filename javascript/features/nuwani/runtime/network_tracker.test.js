// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { NetworkTracker } from 'features/nuwani/runtime/network_tracker.js';
import { Message } from 'features/nuwani/runtime/message.js';

describe('NetworkTracker', it => {
    it('should be able to extract network configuration from RPL_ISUPPORT', assert => {
        const tracker = new NetworkTracker();

        tracker.handleMessage(new Message(':server.com 005 A=a B C=ddd :are supported'));
        tracker.handleMessage(new Message(':server.com 005 NAMESX SAFELIST :are supported'));

        assert.equal(tracker.getSupportRule('A'), 'a');
        assert.isTrue(tracker.getSupportRule('B'));
        assert.equal(tracker.getSupportRule('C'), 'ddd');
        assert.isTrue(tracker.getSupportRule('NAMESX'));

        assert.isUndefined(tracker.getSupportRule('are'));
        assert.isUndefined(tracker.getSupportRule(':are'));
        assert.isUndefined(tracker.getSupportRule('supported'));
    });
});
