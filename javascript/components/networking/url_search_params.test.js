// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { URLSearchParams } from 'components/networking/url_search_params.js';

describe('URLSearchParams', it => {
    it('can initialize parameters based on three formats', assert => {
        const stringParams = new URLSearchParams('a=1&b=2&c=3');

        assert.isTrue(stringParams.has('a'));
        assert.strictEqual(stringParams.get('a'), '1');

        assert.isTrue(stringParams.has('b'));
        assert.strictEqual(stringParams.get('b'), '2');

        assert.isTrue(stringParams.has('c'));
        assert.strictEqual(stringParams.get('c'), '3');

        assert.equal(stringParams.toString(), 'a=1&b=2&c=3');

        const singularArray = new URLSearchParams([ 'e=5', 'd=4' ]);

        assert.isTrue(singularArray.has('d'));
        assert.strictEqual(singularArray.get('d'), '4');

        assert.isTrue(singularArray.has('e'));
        assert.strictEqual(singularArray.get('e'), '5');

        singularArray.sort();

        assert.equal(singularArray.toString(), 'd=4&e=5');

        const arrayParams = new URLSearchParams([
            [ 'f', '6' ],
            [ 'g', '7' ],
        ]);

        assert.isTrue(arrayParams.has('f'));
        assert.strictEqual(arrayParams.get('f'), '6');

        assert.isTrue(arrayParams.has('g'));
        assert.strictEqual(arrayParams.get('g'), '7');

        assert.equal(arrayParams.toString(), 'f=6&g=7');
    });

    it('is able to set, get and delete data', assert => {
        const params = new URLSearchParams();

        assert.deepEqual(params.getAll('name'), []);
        assert.isFalse(params.has('name'));

        params.append('name', 'value');
        params.append('name', 'value2');

        assert.equal(params.get('name'), 'value');
        assert.deepEqual(params.getAll('name'), ['value', 'value2']);
        assert.isTrue(params.has('name'));

        params.set('name', 'value3');

        assert.equal(params.get('name'), 'value3');
        assert.deepEqual(params.getAll('name'), [ 'value3' ]);
        assert.isTrue(params.has('name'));

        params.delete('name');

        assert.isUndefined(params.get('name'));
        assert.deepEqual(params.getAll('name'), []);
        assert.isFalse(params.has('name'));
    });

    it('provides a sensible iterator', assert => {
        const params = new URLSearchParams();

        params.set('a', 1);
        params.set('b', 2);
        params.set('c', 3);
        params.append('c', 4);

        const result = [];
        for (const [ name, value ] of params)
            result.push([ name, value ]);
    
        assert.deepEqual(result, [
            [ 'a', '1' ],
            [ 'b', '2' ],
            [ 'c', '3' ],
            [ 'c', '4' ],
        ]);
    });

    it('is able to sort and stringify the output', assert => {
        const unsortedParams = new URLSearchParams();
        const sortedParams = new URLSearchParams();

        unsortedParams.set('b', 1); sortedParams.set('b', 1);
        unsortedParams.set('a', 2); sortedParams.set('a', 2);
        unsortedParams.set('d', 3); sortedParams.set('d', 3);
        unsortedParams.set('c', 4); sortedParams.set('c', 4);

        sortedParams.sort();

        assert.equal(unsortedParams.toString(), 'b=1&a=2&d=3&c=4');
        assert.equal(sortedParams.toString(), 'a=2&b=1&c=4&d=3');
    });
});
