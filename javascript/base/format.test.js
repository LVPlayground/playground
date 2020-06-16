// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { format, parseMessageToFormattingList } from 'base/format.js';

describe('format', it => {
    it('reject invalid messages by throwing an exception', assert => {
        assert.throws(() => parseMessageToFormattingList('hello %'));
    });
    
    it('should be able to substitute formatting parameters', assert => {
        assert.equal(format(''), '');
        assert.equal(format('Hello, world'), 'Hello, world');
        assert.equal(format('Hello, %%orld'), 'Hello, %orld');
    });

    it('it able to parse messages to formatting lists', assert => {
        assert.deepEqual(parseMessageToFormattingList('Hello, world'), [
            { type: 0, text: 'Hello, world' },
        ]);

        assert.deepEqual(parseMessageToFormattingList('Hello, %%orld'), [
            { type: 0, text: 'Hello, ' },
            { type: 0, text: '%' },
            { type: 0, text: 'orld' },
        ]);
    });
});
