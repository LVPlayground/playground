// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Messages } from 'components/i18n/messages.js';

describe('Messages', it => {
    it('should be able to register and translate messages', assert => {
        const messages = new Messages();
        const extendedMessages = messages.extend({
            testing_message: 'Hello, %s!',
        });

        assert.strictEqual(messages, extendedMessages);
        assert.isTrue(messages.hasOwnProperty('testing_message'));
        assert.typeOf(messages.testing_message, 'function');

        assert.equal(messages.testing_message(null, 'world'), 'Hello, world!');

        const updatedMessages = messages.extend({
            testing_message: 'Howdy, %s!',
        });

        assert.strictEqual(messages, updatedMessages);
        assert.equal(messages.testing_message(null, 'world'), 'Howdy, world!');
    });
});
