// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Body } from 'components/networking/body.js';
import { FormData } from 'components/networking/form_data.js';
import { Headers } from 'components/networking/headers.js';
import { URLSearchParams } from 'components/networking/url_search_params.js';

import { formDataToArrayBuffer } from 'components/networking/form_data.js';
import { stringToUtf8Buffer } from 'components/networking/utf-8.js';

// Valid values for the `redirect` parameter as part of the RequestInit.
const kValidRedirect = ['follow', 'error', 'manual'];

// Implementation of the Request class from the Fetch API:
// https://fetch.spec.whatwg.org/#request-class
//
// Many of the properties supported by the Request class are intended for use in browsers, which do
// not cleanly map to use in alternative environments like ours. Therefore a series of properties
// will continue to be unsupported, whereas we will implement what makes sense.
export class Request extends Body {
    #method_ = null;
    #url_ = null;
    #headers_ = null;

    // Unsupported: destination
    #referrer_ = null;
    // Unsupported: referrerPolicy
    // Unsupported: mode
    // Unsupported: credentials
    // Unsupported: cache
    #redirect_ = null;
    // Unsupported: integrity
    // Unsupported: keepalive
    // Unsupported: isReloadNavigation
    // Unsupported: isHistoryNavigation
    // Unsupported: signal

    constructor(input, init = {}) {
        if (typeof input !== 'string')
            throw new Error(`Sorry, only URL strings are supported as |input| for now.`);

        let contentType = null;

        if (typeof init.body === 'undefined' || init.body === null) {
            super();  // empty body
        } else if (init.body instanceof ArrayBuffer || ArrayBuffer.isView(init.body)) {
            super(init.body);  // body based on an array buffer
        } else if (init.body instanceof FormData) {
            const encoded = formDataToArrayBuffer(init.body);
            super(encoded.data);  // body based on FormData
            contentType = 'multipart/form-data; boundary=' + encoded.boundary;
        } else if (init.body instanceof URLSearchParams) {
            super(stringToUtf8Buffer(init.body.toString()));  // body based on URLSearchParams
            contentType = 'application/x-www-form-urlencoded;charset=UTF-8';
        } else if (typeof init.body === 'string') {
            super(stringToUtf8Buffer(init.body));  // body based in textual data
            contentType = 'text/plain;charset=UTF-8';
        } else {
            throw new Error(`Unrecognised body information given: ${init.body}`);
        }

        this.#method_ = init.method ?? 'GET';
        this.#url_ = input;
        this.#headers_ = new Headers(init.headers ?? null);

        if (init.redirect && !kValidRedirect.includes(init.redirect))
            throw new Error(`Invalid redirect value given: ${init.redirect}.`);

        this.#referrer_ = init.referrer ?? 'https://play.sa-mp.nl/';
        this.#redirect_ = init.redirect ?? 'follow';

        if (contentType !== null)
            this.#headers_.set('Content-Type', contentType);
    }

    // Gets the method that will be used for this request ('GET', 'POST', etc...)
    get method() { return this.#method_; }

    // Gets the URL that will be used for this request.
    get url() { return this.#url_; }

    // Gets the headers, as a Headers instance, that will apply to this request.
    get headers() { return this.#headers_; }

    // Gets the referrer URL of the source of this request.
    get referrer() { return this.#referrer_; }

    // Gets whether this request should follow redirects.
    get redirect() { return this.#redirect_; }
}
