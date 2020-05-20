// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CircularReadOnlyBuffer } from 'base/circular_read_only_buffer.js';

describe('CircularReadOnlyBuffer', it => {
    it('will throw when not enough values have been given', assert => {
        assert.throws(() => new CircularReadOnlyBuffer());
    });

    it('is able to vend values in sequence', assert => {
        const numberBuffer = new CircularReadOnlyBuffer(1, 2, 3);
        assert.equal(numberBuffer.next(), 1);
        assert.equal(numberBuffer.next(), 2);
        assert.equal(numberBuffer.next(), 3);
        assert.equal(numberBuffer.next(), 1);

        const stringBuffer = new CircularReadOnlyBuffer('aap', 'noot', 'mies');
        assert.equal(stringBuffer.next(), 'aap');
        assert.equal(stringBuffer.next(), 'noot');
        assert.equal(stringBuffer.next(), 'mies');
        assert.equal(stringBuffer.next(), 'aap');
    });
});
