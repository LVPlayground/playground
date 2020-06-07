// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Request } from 'components/networking/request.js';
import { URL } from 'components/networking/url.js';

import { fetch } from 'components/networking/fetch.js';
import { createRequestBuffer, setResponseForTesting } from 'components/networking/fetch.js';
import { utf8BufferToString } from 'components/networking/utf-8.js';

describe('fetch', (it, beforeEach, afterEach) => {
    afterEach(() => setResponseForTesting(null));

    it('should be able to create simple HTTP requests', assert => {
        // (1) GET requests with an additional header
        {
            const request = new Request('https://sa-mp.nl/version.txt', {
                headers: [[ 'Content-Language', 'nl_NL' ]]
            });

            const url = new URL(request.url);
            const buffer = createRequestBuffer(request, url);
            const bufferText = utf8BufferToString(buffer);

            assert.strictEqual(bufferText, `GET /version.txt HTTP/1.1\r\n` +
                                           `Host: sa-mp.nl\r\n` +
                                           `Content-Language: nl_NL\r\n\r\n`);
        }

        // (2) POST requests with an implicit Content-Type header.
        {
            const request = new Request('https://sa-mp.nl/update.php', {
                method: 'POST',
                body: 'Version 3.14',
            });

            const url = new URL(request.url);
            const buffer = createRequestBuffer(request, url);
            const bufferText = utf8BufferToString(buffer);

            assert.strictEqual(bufferText, `POST /update.php HTTP/1.1\r\n` +
                                           `Host: sa-mp.nl\r\n` +
                                           `Content-Type: text/plain;charset=UTF-8\r\n\r\n` +
                                           `Version 3.14`);
        }
    });
});
