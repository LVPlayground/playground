// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Request } from 'components/networking/request.js';
import { Response } from 'components/networking/response.js';
import { URL } from 'components/networking/url.js';

import { stringToUtf8Buffer } from 'components/networking/utf-8.js';

// Timeout for the connection, in seconds.
const kConnectionTimeoutSec = 5;

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
    const url = new URL(request.url);
    if (!url.hostname || !url.port)
        throw new Error(`The ${request.url} does not represent a valid URL with a host and port.`);

    const requestBuffer = createRequestBuffer(request, url);
    if (responseMapForTests.has(request.url))
        return responseMapForTests.get(request.url);

    const responseBuffer = await issueNetworkRequest(requestBuffer, url);
    if (!responseBuffer)
        return Response.error();

    

    console.log(responseBuffer.byteLength);
}

// Creates a request buffer containing a full, valid HTTP/1.1 header, combined with the |request|,
// the |request|'s body when available, for the |url| which has to be a URL instance.
export function createRequestBuffer(request, url) {
    const requestQuery = url.search;
    const requestPath = `${url.pathname ?? '/'}${requestQuery ? ('?' + requestQuery) : ''}`;

    let requestData = '';
    requestData += `${request.method} ${requestPath} HTTP/1.1\r\n`;
    requestData += `Host: ${url.hostname}\r\n`;

    // LVP behaviour: request connections to be closed by default.
    if (!request.headers.has('Connection'))
        requestData += 'Connection: close\r\n';

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

// Function that actually issues a network request to the |url|, sending the |requestBuffer|. Will
// receive data until either the connection has been closed, or we've found EOF.
async function issueNetworkRequest(requestBuffer, url) {
    let resolver = null;
    let eof = false;

    const promise = new Promise(resolve => resolver = resolve);
    const received = [];

    const socket = new Socket('tcp');
    socket.addEventListener('close', () => {
        let currentSize = 0;
        let totalSize = 0;

        // (1) Tally the total number of bytes received from the network.
        for (const data of received)
            totalSize += data.byteLength;

        // If no data was received at all, we return NULL to signal failure.
        if (!totalSize)
            return resolver(null);
            
        const receiveBuffer = new Uint8Array(totalSize);

        // (2) Concatenate all the receive buffers in a single, larger buffer.
        for (const data of received) {
            receiveBuffer.set(data, currentSize);
            currentSize += data.byteLength;
        }

        // (3) Resolve the |resolver| with the |receiveBuffer|.
        return resolver(receiveBuffer);
    });

    socket.addEventListener('error', ({ code, message }) => socket.close());
    socket.addEventListener('message', ({ data }) => received.push(data));

    // Open the socket with default settings.
    const openResult = await socket.open({
        ip: url.hostname,
        port: url.port,
        timeout: kConnectionTimeoutSec,
        ssl: url.protocol === 'https' ? 'auto' : 'none'
    });

    if (!openResult)
        return null;

    // Write the |requestBuffer| to the |socket| to initiate the request.
    await socket.write(requestBuffer);

    return promise;
}

// Fixes the |response| when fetches to a given |url| are being made. When the given |url| is NULL,
// the entire response map will be cleared instead.
export function setResponseForTesting(url, response) {
    if (url === null)
        responseMapForTests.clear();
    else
        responseMapForTests.set(url, response);
}
