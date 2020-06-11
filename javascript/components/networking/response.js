// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Body } from 'components/networking/body.js';
import { Headers } from 'components/networking/headers.js';

import { kHttpStatusCodes } from 'components/networking/http_status_codes.js';

// Implementation of the Fetch Response class:
// https://fetch.spec.whatwg.org/#response-class
export class Response extends Body {
    // Creates a Response object that represents an error.
    static error(init = {}) { return new Response(null, init); }

    // Creates a Response object that represents a Redirect.
    static redirect(url, status = 302) {
        return new Response(null, { status, headers: [[ 'Location', url ]] });
    }

    #type_ = null;  // { default, error }

    #url_ = null;
    #redirected_ = null;
    #status_ = null;
    #headers_ = null;

    constructor(bodyInit = null, init = {}) {
        super(bodyInit);

        this.#url_ = init.url ?? undefined;
        this.#redirected_ = init.redirected ?? false;
        this.#status_ = init.status ?? 0;
        this.#headers_ = new Headers(init.headers ?? null);

        this.#type_ = this.#status_ > 0 ? 'default' : 'error';
    }

    // Gets the type of response embodied by this instance.
    get type() { return this.#type_; }

    // Gets the URL of the response, at the end of the redirect chain.
    get url() { return this.#url_; }

    // Gets whether the Response encountered a redirect before returning.
    get redirected() { return this.#redirected_; }

    // Gets the HTTP status code of the response.
    get status() { return this.#status_; }

    // Gets the HTTP status code text of the response.
    get statusText() { return kHttpStatusCodes.get(this.#status_) ?? 'Unknown'; }

    // Gets whether the response is "ok", that is, not an error and a status code in the 200s.
    get ok() { return this.#status_ >= 200 && this.#status_ < 300; }

    // Gets the headers that were provided with the response.
    get headers() { return this.#headers_; }
}
