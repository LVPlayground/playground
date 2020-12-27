// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { format, parseMessageToFormattingList } from 'base/format.js';

describe('format', it => {
    it('reject invalid messages by throwing an exception', assert => {
        assert.throws(() => parseMessageToFormattingList('hello %'));
        assert.throws(() => parseMessageToFormattingList('hello %:hello'));
        assert.throws(() => parseMessageToFormattingList('hello %A'));

        assert.throws(() => format('hello %s'));
        assert.throws(() => format('hello %s %d', 'aa'));
        assert.throws(() => format('hello %[1]s', 'aa'));
    });
    
    it('should be able to substitute formatting parameters', assert => {
        const gunther = server.playerManager.getById(/* Gunther= */ 0);

        assert.equal(format(''), '');
        assert.equal(format('Hello, world'), 'Hello, world');
        assert.equal(format('Hello, %%orld'), 'Hello, %orld');

        // Placeholder: %d
        assert.equal(format('[%d]', 1), '[1]');
        assert.equal(format('[%d]', 1.25), '[1]');
        assert.equal(format('[%d]', -10), '[-10]');
        assert.equal(format('[%+d]', 10), '[+10]');
        assert.equal(format('[%d]', '023'), '[23]');
        assert.equal(format('[%d]', {}), '[NaN]');
        assert.equal(format('[%5d]', 10), '[   10]');
        assert.equal(format('[%-5d]', 10), '[10   ]');
        assert.equal(format('[%05d]', 10), '[00010]');
        assert.equal(format('[%0-5d]', 10), '[10000]');
        assert.equal(format('[%5d]', -10), '[  -10]');
        assert.equal(format('[%-5d]', -10), '[-10  ]');
        assert.equal(format('[%05d]', -10), '[-0010]');
        assert.equal(format('[%0-5d]', -10), '[-1000]');
        assert.equal(format('[%d]', 10000), '[10,000]');
        assert.equal(format('[%d]', 10000.25), '[10,000]');
        assert.equal(format('[%d]', -10000), '[-10,000]');
        assert.equal(format('[%+d]', 10000), '[+10,000]');
        assert.equal(format('[%{1}d]', 10, -10), '[-10]');
        assert.equal(format('[%{value}d]', { value: -10 }), '[-10]');

        // Placeholder: %f
        assert.equal(format('[%f]', 1), '[1]');
        assert.equal(format('[%f]', 1.25), '[1.25]');
        assert.equal(format('[%f]', -10), '[-10]');
        assert.equal(format('[%+f]', 10), '[+10]');
        assert.equal(format('[%f]', Number.NaN), '[NaN]');
        assert.equal(format('[%f]', Number.NEGATIVE_INFINITY), '[-∞]');
        assert.equal(format('[%f]', Number.POSITIVE_INFINITY), '[∞]');
        assert.equal(format('[%+f]', Number.POSITIVE_INFINITY), '[+∞]');
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
        assert.equal(format('[%f]', 10000), '[10,000]');
        assert.equal(format('[%f]', 10000.25), '[10,000.25]');
        assert.equal(format('[%f]', 10000.56432189), '[10,000.56]');
        assert.equal(format('[%.4f]', 10000.56432189), '[10,000.5643]');
        assert.equal(format('[%.8f]', 10000.56432189), '[10,000.56432189]');
        assert.equal(format('[%f]', -10000), '[-10,000]');
        assert.equal(format('[%+f]', 10000.25), '[+10,000.25]');
        assert.equal(format('[%f]', -10000.56432189), '[-10,000.56]');
        assert.equal(format('[%{1}f]', 25, -10000.56432189), '[-10,000.56]');
        assert.equal(format('[%{value}f]', { value: -10000.56432189 }), '[-10,000.56]');

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
        assert.equal(format(`[%{1}'a-5.3s]`, 'banana', 'jip'), '[jipaa]');
        assert.equal(format(`[%{value}'a-5.3s]`, { value: 'jip' }), '[jipaa]');

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
        assert.equal(format('[%$]', 10000), '[$10,000]');
        assert.equal(format('[%$]', 10000.25), '[$10,000]');
        assert.equal(format('[%$]', -10000), '[-$10,000]');
        assert.equal(format('[%+$]', 10000), '[+$10,000]');

        // Miscellaneous
        assert.equal(format('[%b]', 25), '[11001]');
        assert.equal(format('[%o]', 25), '[31]');
        assert.equal(format('[%X]', 16776960), '[FFFF00]');
        assert.equal(format('[%%%s]', 25), '[%25]');
        assert.equal(format('[%s%%]', 25), '[25%]');
        assert.equal(format('[%d%d]', 1, 5), '[15]');

        // Multi-parameter formats
        assert.equal(format('%d %s', 255, 'Foo Bar'), '255 Foo Bar');
        assert.equal(format('%{0}d %{1}s', 255, 'Foo Bar'), '255 Foo Bar');
        assert.equal(format('%{1}d %{0}s', 'Foo Bar', 255), '255 Foo Bar');
        assert.equal(
            format('%{first}d %{second}s', { first: 255, second: 'Foo Bar' }), '255 Foo Bar');

        // Nested parameter names
        assert.equal(
            format('%{player.name}s (Id:%{player.id}d)', { player: gunther }), 'Gunther (Id:0)');

        // Options in formats
        assert.equal(format('[%{=0(zero) =1(one)}d]', 0), '[zero]');
        assert.equal(format('[%{=0(zero) =1(one)}d]', 1), '[one]');
        assert.equal(format('[%{=0(zero) =1(one)}d]', 2), '[2]');
        assert.equal(format('[%{=0(zero) =1(one)}d]', 1234), '[1,234]');
        assert.equal(format('[%{=other(yes)}d]', 1), '[yes]');
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

        assert.deepEqual(parseMessageToFormattingList(`a%{25}sb`), [
            { type: '📝', text: 'a' },
            { type: 's', index: 25 },
            { type: '📝', text: 'b' },
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

        assert.deepEqual(parseMessageToFormattingList(`a%{1}+0-10.5db`), [
            { type: '📝', text: 'a' },
            {
                type: 'd',
                index: 1,
                sign: true,
                padding: '0',
                leftAlign: true,
                width: 10,
                precision: 5
            },
            { type: '📝', text: 'b' },
        ]);

        assert.deepEqual(parseMessageToFormattingList(`a %{1}s b %{0}$ c`), [
            { type: '📝', text: 'a ' },
            { type: 's', index: 1 },
            { type: '📝', text: ' b ' },
            { type: '$', index: 0 },
            { type: '📝', text: ' c' },
        ]);

        assert.deepEqual(parseMessageToFormattingList(`a %{name}s b %{price}$ c`), [
            { type: '📝', text: 'a ' },
            { type: 's', property: [ 'name' ] },
            { type: '📝', text: ' b ' },
            { type: '$', property: [ 'price' ] },
            { type: '📝', text: ' c' },
        ]);

        assert.deepEqual(parseMessageToFormattingList(`a %{name.sub}s b`), [
            { type: '📝', text: 'a ' },
            { type: 's', property: [ 'name', 'sub' ] },
            { type: '📝', text: ' b' },
        ]);

        assert.deepEqual(parseMessageToFormattingList(`a %{name, =0(foo) =other(bar)}s b`), [
            { type: '📝', text: 'a ' },
            { type: 's', property: [ 'name' ], options: { '0': 'foo', 'other': 'bar' } },
            { type: '📝', text: ' b' },
        ]);

        assert.deepEqual(parseMessageToFormattingList(`a %{1, =0(foo) =other(bar)}s b`), [
            { type: '📝', text: 'a ' },
            { type: 's', index: 1, options: { '0': 'foo', 'other': 'bar' } },
            { type: '📝', text: ' b' },
        ]);

        assert.deepEqual(parseMessageToFormattingList(`a %{=0(foo) =other(bar)}s b`), [
            { type: '📝', text: 'a ' },
            { type: 's', options: { '0': 'foo', 'other': 'bar' } },
            { type: '📝', text: ' b' },
        ]);
    });
});
