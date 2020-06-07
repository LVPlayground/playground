// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Request } from 'components/networking/request.js';
import { Response } from 'components/networking/response.js';
import { URL } from 'components/networking/url.js';

import { stringToUtf8Buffer } from 'components/networking/utf-8.js';

// Maximum number of redirects the fetch() function is willing to follow.
const kMaximumRedirects = 3;

// Map of predefined responses used for testing.
const responseMapForTests = new Map();

// Partial implementation of the JavaScript fetch() API:
// https://fetch.spec.whatwg.org/#fetch-api
//
// The README.md file documents to what extend we support the API, but the common cases are
// supported and any bugs therein should be considered a bug to fix.
export async function fetch(input, init = {}) {
    const request = new Request(input, init);
}

// Fetches the |request| and returns a populated |response| object. Redirects will not be honored
// either, that's the job of the actual `fetch()` method.
export async function fetchIndividualRequest(request) {
    if (responseMapForTests.has(request.url))
        return responseMapForTests.get(request.url);

    const url = new URL(request.url);
    if (!url.hostname || !url.port)
        throw new Error(`The ${request.url} does not represent a valid URL with a host and port.`);

    const requestBuffer = createRequestBuffer(request, url);
    console.log(requestBuffer.byteLength);
}

// Creates a request buffer containing a full, valid HTTP/1.1 header, combined with the |request|,
// the |request|'s body when available, for the |url| which has to be a URL instance.
export function createRequestBuffer(request, url) {
    const requestQuery = url.search;
    const requestPath = `${url.pathname ?? '/'}${requestQuery ? ('?' + requestQuery) : ''}`;

    let requestData = '';
    requestData += `${request.method} ${requestPath} HTTP/1.1\r\n`;
    requestData += `Host: ${url.hostname}\r\n`;

    for (const [ name, value ] of request.headers)
        requestData += `${name}: ${value}\r\n`;
    
    requestData += '\r\n';

    const requestHeader = stringToUtf8Buffer(requestData);
    const requestBody = request.body;

    const requestBuffer = new Uint8Array(requestHeader.byteLength + requestBody.byteLength);
    requestBuffer.set(new Uint8Array(requestHeader), 0);
    requestBuffer.set(new Uint8Array(requestBody), requestHeader.byteLength);

    return requestBuffer;
}

// Fixes the |response| when fetches to a given |url| are being made. When the given |url| is NULL,
// the entire response map will be cleared instead.
export function setResponseForTesting(url, response) {
    if (url === null)
        responseMapForTests.clear();
    else
        responseMapForTests.set(url, response);
}
