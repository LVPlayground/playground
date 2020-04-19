// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { CaseInsensitiveMap } from 'base/case_insensitive_map.js';

describe('CaseInsensitiveMap', it => {
    it('should ignore casing when manipulating entries in the map', assert => {
        const map = new CaseInsensitiveMap();

        assert.equal(map.size, 0);
        assert.isFalse(map.has('Key'));
        
        map.set('key', 42);

        assert.equal(map.size, 1);
        assert.isTrue(map.has('KEY'));
        assert.equal(map.get('KeY'), 42);

        map.delete('keY');

        assert.isFalse(map.has('kEy'));
        assert.equal(map.size, 0);

        map.set('key', 50);

        assert.equal(map.size, 1);

        map.clear();

        assert.equal(map.size, 0);
    });

    it('should have all lowercased keys when iterating over the map', assert => {
        const map = new CaseInsensitiveMap();

        map.set('Key', 42);
        map.set('KEY2', 43);
        map.set('key3', 44);

        for (const [key, value] of map.entries())
            assert.equal(key, key.toLowerCase());
        
        for (const key of map.keys())
            assert.equal(key, key.toLowerCase());
    });

    it('should ignore key types that are types other than a string', assert => {
        const map = new CaseInsensitiveMap();
        
        map.set(42, 42);
        map.set(42.001, 15);
        map.set(false, 1);
    });
});
