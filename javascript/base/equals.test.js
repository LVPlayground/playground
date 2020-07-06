// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { equals } from 'base/equals.js';

describe('equals', it => {
    it('should be able to determine equality between given values', assert => {
        function multiply(a, b) { return a * b; }
        function add(a, b) { return a + b; }

        assert.isTrue(equals('hello', 'hello'));
        assert.isTrue(equals(42, 42));
        assert.isTrue(equals(Math.PI, Math.PI));
        assert.isTrue(equals(true, true));
        assert.isTrue(equals(null, null));
        assert.isTrue(equals(undefined, undefined));
        assert.isTrue(equals(Number.NaN, Number.NaN));
        assert.isTrue(equals(NaN, NaN));

        assert.isFalse(equals('hello', 'world'));
        assert.isFalse(equals(42, 44));
        assert.isFalse(equals(Math.PI, Math.SQRT2));
        assert.isFalse(equals(true, false));
        assert.isFalse(equals(null, undefined));
        assert.isFalse(equals(undefined, null));
        assert.isFalse(equals(NaN, Math.PI));

        assert.isTrue(equals(new Date('2020-07-06 19:51:12'), new Date('2020-07-06 19:51:12')));
        assert.isFalse(equals(new Date('2020-07-06 19:51:12'), new Date('2020-07-07 19:51:12')));

        assert.isTrue(equals(multiply, multiply));
        assert.isFalse(equals(multiply, add));

        assert.isTrue(equals([ 1, 2, 3 ], [ 1, 2, 3 ]));
        assert.isFalse(equals([ 1, 2, 3 ], [ 3, 2, 1 ]));
        assert.isTrue(equals([ 1, 'hello', [ 1, 2 ] ], [ 1, 'hello', [ 1, 2 ] ]));

        assert.isTrue(equals({ foo: 1 }, { foo: 1 }));
        assert.isTrue(equals({ foo: 1, bar: 2 }, { foo: 1, bar: 2 }));
        assert.isTrue(equals({ foo: 1, bar: 2 }, { bar: 2, foo: 1 }));
        assert.isFalse(equals({ foo: 1 }, { bar: 2 }));
        assert.isTrue(equals({ foo: { bar: 1 } }, { foo: { bar: 1 } }));

        assert.isTrue(
            equals(new Map([ [ 'foo', 1 ], [ 'bar', 2 ] ]),
                   new Map([ [ 'foo', 1 ], [ 'bar', 2 ] ])));
        assert.isTrue(
            equals(new Map([ [ 'foo', 1 ], [ 'bar', 2 ] ]),
                   new Map([ [ 'bar', 2 ], [ 'foo', 1 ] ])));
        assert.isFalse(
            equals(new Map([ [ 'foo', 1 ], [ 'bar', 2 ] ]),
                   new Map([ [ 'bar', 1 ], [ 'foo', 2 ] ])));

        assert.isTrue(equals(new Set([ 1, 2, 3 ]), new Set([ 1, 2, 3 ])));
        assert.isTrue(equals(new Set([ 1, 2, 3 ]), new Set([ 3, 2, 1 ])));
        assert.isFalse(equals(new Set([ 1, 2, 3 ]), new Set([ 1, 2, 3, 4 ])));

        assert.isTrue(equals({
                value: true,
                options: {
                    map: new Map([ [ 'foo', 1 ], [ 'bar', 2 ] ]),
                    set: new Set([ 1, 2, 3 ]),
                },
                functions: [
                    multiply,
                    'Hello world!',
                    Math.PI,
                ]
            }, {
                value: true,
                options: {
                    map: new Map([ [ 'foo', 1 ], [ 'bar', 2 ] ]),
                    set: new Set([ 1, 2, 3 ]),
                },
                functions: [
                    multiply,
                    'Hello world!',
                    Math.PI,
                ]
            }));
    });
});
