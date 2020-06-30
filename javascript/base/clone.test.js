// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { clone } from 'base/clone.js';

describe('clone', it => {
    it('is able to clone simple types', assert => {
        assert.equal(clone(true), true);
        assert.equal(clone(12), 12);
        assert.equal(clone('Hello'), 'Hello');
        assert.strictEqual(clone(null), null);
        assert.strictEqual(clone(undefined), undefined);
    });

    it('is able to clone arrays and array buffers', assert => {
        const data = [ 1, 2, 3 ];

        const cloned = clone(data);
        const copied = data;

        // (1) Verify the structure of the given |clone|.
        assert.equal(cloned.length, 3);
        assert.isTrue(Array.isArray(cloned));

        // (2) Verify the contents of the given |clone|.
        assert.deepEqual(cloned, data);

        // (3) Verify mutability of the |clone| and |copy|.
        data[1] = 4;

        assert.equal(cloned[1], 2);
        assert.equal(copied[1], 4);

        // (4) Confirm that this works with typed arrays as well.
        const array = Uint8Array.from([ 4, 5, 6 ]);
        const clonedArray = clone(array);

        assert.equal(array.length, 3);
        assert.equal(clonedArray.length, 3);
        
        for (let index = 0; index < array.length; ++index)
            assert.equal(clonedArray[index], array[index]);

        assert.notStrictEqual(array, clonedArray);
    });

    it('is able to clone various default object types', assert => {
        // (1) Dates
        const date = new Date('2020-07-01 10:00:00');
        const clonedDate = clone(date);

        assert.equal(date.toString(), clonedDate.toString());

        // (2) Map
        const map = new Map([
            [ 'aap', 'monkey' ],
            [ 'noot', 'nut' ],
            [ 'mies', Math.PI ],
            [ 'qux', undefined ],
        ]);

        const clonedMap = clone(map);

        assert.equal(map.size, clonedMap.size);
        for (const key of map.keys()) {
            assert.isTrue(clonedMap.has(key));
            assert.equal(clonedMap.get(key), map.get(key));
        }

        // (3) Set
        const set = new Set([ 6, 8, 9 ]);
        const clonedSet = clone(set);

        assert.equal(set.size, clonedSet.size);
        for (const value of set)
            assert.isTrue(clonedSet.has(value));
    });

    it('is able to clone objects of any amount of depth', assert => {
        const object = {
            a: 1,
            b: new Map([ [ 'key', { value: 12 } ]]),
            c: /.*/g,
            d: {
                e: 'Hello',
            },
            e: Symbol('hello'),
        };

        const clonedObject = clone(object);

        assert.strictEqual(clonedObject.a, 1);
        assert.instanceOf(clonedObject.b, Map);
        assert.equal(clonedObject.b.size, 1);
        assert.isTrue(clonedObject.b.has('key'));
        assert.equal(clonedObject.b.get('key').value, 12);
        assert.typeOf(clonedObject.c, typeof /.*/g);
        assert.equal(clonedObject.d.e, 'Hello');
        assert.typeOf(clonedObject.e, typeof Symbol('hello'));
    });
});
