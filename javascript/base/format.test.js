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
        assert.equal(format('[%d]', '023'), '[23]');
        assert.equal(format('[%d]', {}), '[]');
        assert.equal(format('[%5d]', 10), '[   10]');
        assert.equal(format('[%-5d]', 10), '[10   ]');
        assert.equal(format('[%05d]', 10), '[00010]');
        assert.equal(format('[%0-5d]', 10), '[10000]');
        assert.equal(format('[%5d]', -10), '[  -10]');
        assert.equal(format('[%-5d]', -10), '[-10  ]');
        assert.equal(format('[%05d]', -10), '[-0010]');
        assert.equal(format('[%0-5d]', -10), '[-1000]');

        // Placeholder: %f
        assert.equal(format('[%f]', 1), '[1]');
        assert.equal(format('[%f]', 1.25), '[1.25]');
        assert.equal(format('[%f]', -10), '[-10]');
        assert.equal(format('[%+f]', 10), '[+10]');
        assert.equal(format('[%f]', Number.NaN), '[NaN]');
        assert.equal(format('[%f]', Number.NEGATIVE_INFINITY), '[-Infinity]');
        assert.equal(format('[%f]', Number.POSITIVE_INFINITY), '[Infinity]');
        assert.equal(format('[%+f]', Number.POSITIVE_INFINITY), '[+Infinity]');
        assert.equal(format('[%.0f]', 1.56432189), '[2]');
        assert.equal(format('[%.1f]', 1.56432189), '[1.6]');
        assert.equal(format('[%.2f]', 1.56432189), '[1.56]');
        assert.equal(format('[%.3f]', 1.56432189), '[1.564]');
        assert.equal(format('[%.2f]', '314e-2'), '[3.14]');
        assert.equal(format('[%f]', {}), '[NaN]');
        assert.equal(format('[%6.2f]', 1.34689), '[  1.35]');
        assert.equal(format('[%-6.2f]', 1.34689), '[1.35  ]');
        assert.equal(format('[%06.2f]', 1.34689), '[001.35]');
        assert.equal(format('[%0-6.2f]', 1.34689), '[1.3500]');
        assert.equal(format('[%6.2f]', -1.34689), '[ -1.35]');
        assert.equal(format('[%-6.2f]', -1.34689), '[-1.35 ]');
        assert.equal(format('[%06.2f]', -1.34689), '[-01.35]');
        assert.equal(format('[%0-6.2f]', -1.34689), '[-1.350]');

        // Placeholder: %s
        assert.equal(format('[%s]', ''), '[]');
        assert.equal(format('[%s]', 'banana'), '[banana]');
        assert.equal(format('[%s]', {}), '[[object Object]]');
        assert.equal(format('[%s]', { toString: () => 'abc' }), '[abc]');
        assert.equal(format('[%.3s]', 'abcdef'), '[abc]');
        assert.equal(format('[%.9s]', 'abcdef'), '[abcdef]');
        assert.equal(format('[%s]', 21.25), '[21.25]');
        assert.equal(format('[%s]', Number.NaN), '[]');
        assert.equal(format('[%5s]', 'abc'), '[  abc]');
        assert.equal(format('[%-5s]', 'abc'), '[abc  ]');
        assert.equal(format('[%5.3s]', 'banana'), '[  ban]');
        assert.equal(format('[%-5.3s]', 'banana'), '[ban  ]');
        assert.equal(format(`[%'a5.3s]`, 'banana'), '[aaban]');
        assert.equal(format(`[%'a-5.3s]`, 'banana'), '[banaa]');

        // Placeholder: %x
        assert.equal(format('[%x]', 15), '[f]');
        assert.equal(format('[%x]', 16776960), '[ffff00]');
        assert.equal(format('[%x]', 4294901930), '[ffff00aa]');
        assert.equal(format('[%+x]', -10), '[fffffff6]');
        assert.equal(format('[%+x]', 10), '[a]');
        assert.equal(format('[%x]', {}), '[0]');
        assert.equal(format('[%03x]', 15), '[00f]');
        assert.equal(format('[%0-3x]', 15), '[f00]');
        assert.equal(format('[%3x]', 15), '[  f]');
        assert.equal(format('[%-3x]', 15), '[f  ]');

        // Placeholder: %$
        assert.equal(format('[%$]', 1), '[$1]');
        assert.equal(format('[%$]', 1.25), '[$1]');
        assert.equal(format('[%$]', -10), '[-$10]');
        assert.equal(format('[%+$]', 10), '[+$10]');

        // Miscellaneous
        assert.equal(format('[%b]', 25), '[11001]');
        assert.equal(format('[%o]', 25), '[31]');
        assert.equal(format('[%X]', 16776960), '[FFFF00]');
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
