// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Request } from 'components/networking/request.js';
import { Response } from 'components/networking/response.js';
import { URL } from 'components/networking/url.js';

import { fetch } from 'components/networking/fetch.js';

import { createRequestBuffer, createResponse } from 'components/networking/fetch.js';
import { setResponseForTesting } from 'components/networking/fetch.js';

import { stringToUtf8Buffer, utf8BufferToString } from 'components/networking/utf-8.js';

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
                                           `Connection: close\r\n` +
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
                                           `Connection: close\r\n` +
                                           `Content-Length: 12\r\n` +
                                           `Content-Type: text/plain;charset=UTF-8\r\n\r\n` +
                                           `Version 3.14`);
        }
    });

    it('should be able to parse HTTP responses into Response objects', async (assert) => {
        const url = new URL('https://sa-mp.nl/version.json');

        // https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol#Server_response
        const kResponse = `HTTP/1.1 200 OK\r\n` +
                          `Date: Mon, 23 May 2005 22:38:34 GMT\r\n` +
                          `Content-Type: text/json; charset=UTF-8\r\n` +
                          `Content-Length: 17\r\n` +
                          `Cookie: foo=bar\r\n` +
                          `Cookie: bar=qux\r\n` +
                          `Server: Apache/1.3.3.7 (Unix) (Red-Hat/Linux)\r\n` +
                          `Accept-Ranges: bytes\r\n` +
                          `\r\n` +
                          `{ "version": 3.14 }`;

        const responseBuffer = stringToUtf8Buffer(kResponse);
        const response = createResponse(responseBuffer, url);

        assert.equal(response.type, 'default');
        assert.equal(response.url, 'https://sa-mp.nl/version.json');
        assert.equal(response.redirected, false);
        assert.equal(response.status, 200);
        assert.equal(response.statusText, 'OK');
        assert.isTrue(response.ok);

        assert.equal(response.headers.get('Content-Type'), 'text/json; charset=UTF-8');
        assert.equal(response.headers.get('Server'), 'Apache/1.3.3.7 (Unix) (Red-Hat/Linux)');
        assert.equal(response.headers.get('Cookie'), 'foo=bar, bar=qux');

        assert.equal((await response.text()), '{ "version": 3.14 }');
        assert.deepEqual((await response.json()), {
            version: 3.14,
        });
    });

    it('should be able to deal with chunked responses', async (assert) => {
        const url = new URL('https://sa-mp.nl/version.json');
        const kResponse = `HTTP/1.1 200 OK\r\n` +
                          `Transfer-Encoding: chunked\r\n` +
                          `\r\n` +
                          `c\r\n` +
                          `{ "version":\r\n` +
                          `7\r\n` +
                          ` 3.14 }\r\n` +
                          `0\r\n`;
        
        const responseBuffer = stringToUtf8Buffer(kResponse);
        const response = createResponse(responseBuffer, url);

        assert.equal((await response.text()), '{ "version": 3.14 }');
    });

    it('should be able to follow redirects', async (assert) => {
        // (1) Regular redirects.
        setResponseForTesting('https://sa-mp.nl/a', Response.redirect('https://sa-mp.nl/b'));
        setResponseForTesting('https://sa-mp.nl/b', new Response(null, {
            url: 'https://sa-mp.nl/b',
            redirected: true,
            status: 200,
        }));

        const response = await fetch('https://sa-mp.nl/a');
        
        assert.isTrue(response.ok);
        assert.isTrue(response.redirected);
        assert.equal(response.status, 200);
        assert.equal(response.url, 'https://sa-mp.nl/b');

        // (2) Redirect chains.
        setResponseForTesting('https://sa-mp.nl/a', Response.redirect('https://sa-mp.nl/b'));
        setResponseForTesting('https://sa-mp.nl/b', Response.redirect('https://sa-mp.nl/a'));

        const errorResponse = await fetch('https://sa-mp.nl/a');

        assert.isFalse(errorResponse.ok);
        assert.isTrue(errorResponse.redirected);
    });
});
