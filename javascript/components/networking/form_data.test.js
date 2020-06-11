// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { FormData } from 'components/networking/form_data.js';

describe('FormData', it => {
    it('is able to set, get and delete data', assert => {
        const data = new FormData();

        assert.deepEqual(data.getAll('name'), []);
        assert.isFalse(data.has('name'));

        data.append('name', 'value');
        data.append('name', 'value2');

        assert.equal(data.get('name'), 'value');
        assert.deepEqual(data.getAll('name'), ['value', 'value2']);
        assert.isTrue(data.has('name'));

        data.set('name', 'value3');

        assert.equal(data.get('name'), 'value3');
        assert.deepEqual(data.getAll('name'), [ 'value3' ]);
        assert.isTrue(data.has('name'));

        data.delete('name');

        assert.isUndefined(data.get('name'));
        assert.deepEqual(data.getAll('name'), []);
        assert.isFalse(data.has('name'));
    });

    it('provides a sensible iterator', assert => {
        const data = new FormData();

        data.set('a', 1);
        data.set('b', 2);
        data.set('c', 3);
        data.append('c', 4);

        const result = [];
        for (const [ name, value ] of data)
            result.push([ name, value ]);
    
        assert.deepEqual(result, [
            [ 'a', '1' ],
            [ 'b', '2' ],
            [ 'c', '3' ],
            [ 'c', '4' ],
        ]);
    });
});
