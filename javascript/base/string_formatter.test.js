// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { format } from 'base/string_formatter.js';

describe('StringFormatter', it => {
    it('should apply formatting rules', assert => {
        // Not enough parameters will cause exceptions to be thrown.
        assert.throws(() => format('%s'));
        assert.throws(() => format('%s %s', 'foo'));

        // Literal percentage-sign pass-through.
        assert.equal(format('%%'), '%');
        assert.equal(format('%%%%'), '%%');

        // Null and undefined value handling.
        assert.equal(format('%s', null), '[null]');
        assert.equal(format('%s', undefined), '[undefined]');

        // String substitution.
        assert.equal(format('%s', 'foo'), 'foo');
        assert.equal(format('%s', 42), '42');
        assert.equal(format('%s', []), '');
        assert.equal(format('%s', {}), '[object Object]');
        assert.equal(format('%s', ''), '');
    });

    it('should format numbers', assert => {
        assert.equal(format('%d', false), 'false');
        assert.equal(format('%d', {}), '[object Object]');

        assert.equal(format('%d', 42), '42');
        assert.equal(format('%d', 4200), '4,200');
        assert.equal(format('%d', 4200000), '4,200,000');

        assert.equal(format('%d', -42), '-42');
        assert.equal(format('%d', -4200), '-4,200');
        assert.equal(format('%d', -4200000), '-4,200,000');

        assert.equal(format('%d', 42.12345), '42.12');
        assert.equal(format('%d', 42.12567), '42.13');

        assert.equal(format('%d', -42.12345), '-42.12');
        assert.equal(format('%d', -42.12567), '-42.13');
    });

    it('should format prices', assert => {
        assert.equal(format('%$', false), '$0');
        assert.equal(format('%$', {}), '$0');

        assert.equal(format('%$', 2500), '$2,500');
        assert.equal(format('%$', -1337.23), '-$1,337');
        assert.equal(format('%$', 42), '$42');
        assert.equal(format('%$', 1000000), '$1,000,000');
    });

    it('should format times', assert => {
        assert.equal(format('%t', false), 'false');
        assert.equal(format('%t', 'tomorrow'), 'tomorrow');
        assert.equal(format('%t', {}), '[object Object]');

        assert.equal(format('%t', 0), '00:00');
        assert.equal(format('%t', 42), '00:42');
        assert.equal(format('%t', 121), '02:01');
        assert.equal(format('%t', 1835), '30:35');

        assert.equal(format('%t', 3600), '01:00:00');
        assert.equal(format('%t', 3661), '01:01:01');
        assert.equal(format('%t', 7200), '02:00:00');
        assert.equal(format('%t', 36154), '10:02:34');
    });

    it('should work with combinations', assert => {
        assert.equal(format('%d %s %s', 42, 'hello', 'world :)'), '42 hello world :)');
    });
});
