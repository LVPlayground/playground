// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Request } from 'components/networking/request.js';
import { Response } from 'components/networking/response.js';
import { URL } from 'components/networking/url.js';

import { stringToUtf8Buffer, utf8BufferToString } from 'components/networking/utf-8.js';

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

    let url = new URL(request.url);
    if (!url.hostname || !url.port)
        throw new Error(`The ${request.url} does not represent a valid URL with a host and port.`);

    for (let redirect = 0; redirect < kMaximumRedirects; ++redirect) {
        const response = await fetchIndividualRequest(request, url, redirect !== 0);
        if (response.type === 'error' || !isRedirectStatus(response.status))
            return response;
        
        // Respect configuration of the `redirect` property on the Request object.
        if (request.redirect === 'manual')
            return response;
        if (request.redirect === 'error')
            return Response.error();

        // We need the `Location` header to understand where to go.
        if (!response.headers.has('Location')) {
            console.log('[fetch][warning] Missing Location header on redirect to: ' + url);
            return response;
        }
        
        // TODO: The URL class can't yet resolve relative URLs. If you hit this exception, then it's
        // a great moment to file a bug on GitHub to request this to be done.
        if (!response.headers.get('Location').startsWith('http'))
            throw new Error(`Support for URL(url, base) has not been implemented yet.`);

        url = new URL(response.headers.get('Location'));
    }

    // We've hit |kMaximumRedirects| or more redirects when this is hit. Bail out.
    return Response.error({ url: url.href, redirected: true });
}

// Fetches the |request| and returns a populated |response| object. Redirects will not be honored
// either, that's the job of the actual `fetch()` method.
async function fetchIndividualRequest(request, url, redirected) {
    const requestBuffer = createRequestBuffer(request, url);
    if (responseMapForTests.has(url.href))
        return responseMapForTests.get(url.href);

    const responseBuffer = await issueNetworkRequest(requestBuffer, url);
    if (!responseBuffer)
        return Response.error({ url: url.href, redirected });

    return createResponse(responseBuffer, redirected);
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

// Creates the Response object for the given |responseBuffer|, which has been received from the
// |url| that must be an instance of the URL class.
export function createResponse(responseBuffer, url, redirected) {
    let headerBuffer = null;
    let bodyBuffer = null;

    // (1) Find the first double \r\n, which separates the headers from the message body. We split
    // the |responseBuffer| in two as we handle them differently.
    for (let index = 0; index < responseBuffer.length - 3; ++index) {
        if (responseBuffer[index] != 0x0D || responseBuffer[index + 1] != 0x0A)
            continue;  // not looking at a new line
        if (responseBuffer[index + 2] != 0x0D || responseBuffer[index + 3] != 0x0A)
            continue;  // not looking at a double new line
        
        headerBuffer = responseBuffer.slice(0, index + 1);
        bodyBuffer = responseBuffer.slice(index + 4);
        break;
    }

    // If the split were not found, then the response only contains headers. It could be a redirect.
    if (headerBuffer === null)
        headerBuffer = responseBuffer;

    const { status, headers } = createHeaders(headerBuffer);

    return new Response(bodyBuffer, {
        url: url.href,
        redirected, status, headers,
    });
}

// Creates a Header array ([[ name, value ], ... ]) out of the given |headerBuffer|. Each header is
// expected to end with a \r\n, which will not be included in the output. This method also extracts
// the HTTP response status code, which must be the first line of the |headerBuffer|.
function createHeaders(headerBuffer) {
    const headerLines = utf8BufferToString(headerBuffer).split('\r\n');
    if (!headerLines.length)
        return { status: 0, headers: [] };

    const statusText = headerLines.shift();

    let status = 0;
    let headers = [];

    // (1) Extract the HTTP status code out of |statusText|
    const match = statusText.match(/^HTTP\/\d+\.\d+\s+([\d]+)\s+.*$/i);
    if (match.length == 2)
        status = parseInt(match[1], 10);
    else
        console.log('[fetch][warning] Invalid status text: "' + statusText + '"; ignored');

    // (2) Extract the HTTP headers out of the |headerLines|
    for (const line of headerLines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) {
            console.log('[fetch][warning] Invalid header: "' + line + '"; ignored');
            continue;
        }

        headers.push([
            line.substring(0, colonIndex).trim(),
            line.substring(colonIndex + 1).trim(),
        ]);
    }

    return { status, headers };
}

// Returns whether the given |status| indicates that a redirect has to take place.
function isRedirectStatus(status) {
    return status >= 300 && status < 400;
}

// Fixes the |response| when fetches to a given |url| are being made. When the given |url| is NULL,
// the entire response map will be cleared instead.
export function setResponseForTesting(url, response) {
    if (url === null)
        responseMapForTests.clear();
    else
        responseMapForTests.set(url, response);
}
