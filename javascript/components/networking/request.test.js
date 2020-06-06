// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { FormData } from 'components/networking/form_data.js';
import { Headers } from 'components/networking/headers.js';
import { Request } from 'components/networking/request.js';
import { URLSearchParams } from 'components/networking/url_search_params.js';

describe('Request', it => {
    it('is able to create Request objects for arbitrary URLs', assert => {
        const defaultRequest = new Request('https://sa-mp.nl/');

        assert.equal(defaultRequest.method, 'GET');
        assert.equal(defaultRequest.url, 'https://sa-mp.nl/');
        assert.instanceOf(defaultRequest.headers, Headers);
        assert.equal(Array.from(defaultRequest.headers).length, 0);

        const customRequest = new Request('https://sa-mp.nl/', {
            method: 'POST',
            headers: [
                [ 'Content-Type', 'text/html' ],
                [ 'Content-Length', 12 ],
            ],
        });

        assert.equal(customRequest.method, 'POST');
        assert.equal(customRequest.url, 'https://sa-mp.nl/');
        assert.instanceOf(customRequest.headers, Headers);
        assert.equal(Array.from(customRequest.headers).length, 2);
    });

    it('is able to initialize request data based on BodyInit', async (assert) => {
        // (1) Empty data.
        const emptyRequest = new Request('https://sa-mp.nl/');
        assert.equal((await emptyRequest.text()).length, 0);

        // (2) ArrayBuffer / BufferView-based data.
        const bufferData = new Uint8Array([ 72, 101, 108, 108, 111 ]);

        const arrayBufferRequest = new Request('https://sa-mp.nl/', { body: bufferData.buffer });
        assert.equal((await arrayBufferRequest.text()).length, 5);
        assert.equal((await arrayBufferRequest.text()), 'Hello');

        const arrayBufferViewRequest = new Request('https://sa-mp.nl/', { body: bufferData });
        assert.equal((await arrayBufferViewRequest.text()).length, 5);
        assert.equal((await arrayBufferViewRequest.text()), 'Hello');

        // (3) FormData data.


        // (4) URLSearchParams data.
        const params = new URLSearchParams([
            [ 'las', '1'  ],
            [ 'venturas', 'city' ],
            [ 'playground', 'yay' ],
        ]);

        const paramsRequest = new Request('https://sa-mp.nl/', { body: params });
        assert.equal((await paramsRequest.text()).length, 34);
        assert.equal((await paramsRequest.text()), 'las=1&venturas=city&playground=yay');

        // (5) String data.
        const stringRequest = new Request('https://sa-mp.nl/', { body: '🤦' });
        assert.equal((await stringRequest.text()).length, 2);
        assert.equal((await stringRequest.text()), '🤦');

        // (6) Invalid data.
        assert.throws(() => new Request('https://sa-mp.nl/', { body: 3.1415 }));
    });
});
