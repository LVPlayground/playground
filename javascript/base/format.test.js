// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { format, parseMessageToFormattingList } from 'base/format.js';

describe('format', it => {
    it('reject invalid messages by throwing an exception', assert => {
        assert.throws(() => parseMessageToFormattingList('hello %'));
        assert.throws(() => parseMessageToFormattingList('hello %:hello'));
        assert.throws(() => parseMessageToFormattingList('hello %A'));
    });
    
    it('should be able to substitute formatting parameters', assert => {
        assert.equal(format(''), '');
        assert.equal(format('Hello, world'), 'Hello, world');
        assert.equal(format('Hello, %%orld'), 'Hello, %orld');

        // Placeholder: %d
        assert.equal(format('[%d]', 1), '[1]');
        assert.equal(format('[%d]', 1.25), '[1]');
        assert.equal(format('[%d]', -10), '[-10]');
        assert.equal(format('[%+d]', 10), '[+10]');

        // Placeholder: %s
        assert.equal(format('[%s]', ''), '[]');
        assert.equal(format('[%s]', 'banana'), '[banana]');
        assert.equal(format('[%s]', { toString: () => 'abc' }), '[abc]');
        assert.equal(format('[%.3s]', 'abcdef'), '[abc]');
        assert.equal(format('[%.9s]', 'abcdef'), '[abcdef]');
    });

    it('it able to parse messages to formatting lists', assert => {
        assert.deepEqual(parseMessageToFormattingList('Hello, world'), [
            { type: '📝', text: 'Hello, world' },
        ]);

        assert.deepEqual(parseMessageToFormattingList('Hello, %%orld'), [
            { type: '📝', text: 'Hello, ' },
            { type: '📝', text: '%' },
            { type: '📝', text: 'orld' },
        ]);

        assert.deepEqual(parseMessageToFormattingList('Hello, %s'), [
            { type: '📝', text: 'Hello, ' },
            { type: 's' },
        ]);

        assert.deepEqual(parseMessageToFormattingList('Hello, %s, world!'), [
            { type: '📝', text: 'Hello, ' },
            { type: 's' },
            { type: '📝', text: ', world!' },
        ]);

        assert.deepEqual(parseMessageToFormattingList(`a%'x5sb`), [
            { type: '📝', text: 'a' },
            { type: 's', padding: 'x', width: 5 },
            { type: '📝', text: 'b' },
        ]);

        assert.deepEqual(parseMessageToFormattingList(`a%.5sb`), [
            { type: '📝', text: 'a' },
            { type: 's', precision: 5 },
            { type: '📝', text: 'b' },
        ]);

        assert.deepEqual(parseMessageToFormattingList(`a%+db`), [
            { type: '📝', text: 'a' },
            { type: 'd', sign: true },
            { type: '📝', text: 'b' },
        ]);

        assert.deepEqual(parseMessageToFormattingList(`a%-db`), [
            { type: '📝', text: 'a' },
            { type: 'd', leftAlign: true },
            { type: '📝', text: 'b' },
        ]);

        assert.deepEqual(parseMessageToFormattingList(`a%+0-10.5db`), [
            { type: '📝', text: 'a' },
            { type: 'd', sign: true, padding: '0', leftAlign: true, width: 10, precision: 5 },
            { type: '📝', text: 'b' },
        ]);
    });
});
