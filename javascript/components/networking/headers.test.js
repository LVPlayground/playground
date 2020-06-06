// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Headers } from 'components/networking/headers.js';

describe('Headers', it => {
    it('is able to construct headers with populated information', assert => {
        assert.throws(() => new Headers('Content-Length: 12'));
        assert.throws(() => new Headers([ 'Content-Length: 12' ]));

        const headers = new Headers([
            [ 'Content-Type', 'text/html' ],
            [ 'Content-Length', 12 ],
        ]);

        assert.isTrue(headers.has('Content-Type'));
        assert.isTrue(headers.has('Content-Length'));
    });

    it('is able to append multiple headers with the same name', assert => {
        const headers = new Headers();

        assert.isUndefined(headers.get('My-Header'));

        headers.append('My-Header', 1);
        headers.append('My-Header', 2);

        const found = [];
        for (const [ name, value ] of headers)
            found.push(name);

        assert.equal(found.length, 1);
        assert.equal(headers.get('My-Header'), '1, 2');

        headers.set('My-Header', 3);

        const serialized = Array.from(headers);
        assert.equal(serialized.length, 1);
        assert.equal(serialized[0][0], 'My-Header');
        assert.equal(serialized[0][1], 3);
    });

    it('is able to add and remove headers on the fly', assert => {
        const headers = new Headers();

        assert.isFalse(headers.has('My-Header'));

        headers.append('My-Header', 1);

        assert.isTrue(headers.has('My-Header'));

        headers.delete('my-header');

        assert.isFalse(headers.has('My-Header'));

        headers.set('MY-HEADER', 2);

        assert.isTrue(headers.has('My-Header'));
    });
});
