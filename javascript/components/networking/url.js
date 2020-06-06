// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { URLSearchParams } from 'components/networking/url_search_params.js';

import { urlParse } from 'components/networking/url.extern.js';

// Defines the default ports for various URLs: https://url.spec.whatwg.org/#url-miscellaneous
// file:// URLs are omitted here because there's no reason to support them in our code.
const kDefaultPort = new Map([
    [ 'ftp', 21 ],
    [ 'http', 80 ],
    [ 'https', 443 ],
    [ 'ws', 80 ],
    [ 'wss', 443 ],
]);

// Implementation of the WHATWG URL API: https://url.spec.whatwg.org/#api
//
// A third party library is used for the actual URL parsing, but the interface and serialization
// routines are ours. Given that the library predetes the URL standard, it's quite likely that they
// don't fully align. Bugs can be addressed when filed against our repository.
export class URL {
    #protocol_ = null;
    #username_ = null;
    #password_ = null;
    #hostname_ = null;
    #port_ = null;
    #pathname_ = null;
    #searchParams_ = null;
    #hash_ = null;

    constructor(url, base = null) {
        if (base !== null)
            throw new Error('Support for URL(url, base) has not been implemented yet.');
        
        const parsed = urlParse('{}', url);

        this.#protocol_ = parsed.protocol ?? 'https';
        this.#username_ = parsed.user ?? undefined;
        this.#password_ = parsed.pass ?? undefined;
        this.#hostname_ = parsed.hostname;
        this.#port_ = parsed.port ?? kDefaultPort.get(this.#protocol_) ?? 80;
        this.#pathname_ = parsed.path ?? undefined;
        this.#searchParams_ = new URLSearchParams(parsed.query ?? null);
        this.#hash_ = parsed.hash ?? undefined;
    }

    // Gets the serialized URL, as a string, represented by this object.
    get href() { return this.toString(); }

    // Gets the origin for this URL.
    get origin() {
        let output = `${this.#protocol_}://${this.#hostname_}`;
        if (this.#port_ !== kDefaultPort.get(this.#protocol_))
            output += `:${this.#port_}`;
        
        return output;
    }

    // Gets or sets the protocol for this URL.
    get protocol() { return this.#protocol_; }
    set protocol(value) { this.#protocol_ = value; }

    // Gets or sets the username for this URL.
    get username() { return this.#username_; }
    set username(value) { this.#username_ = value; }

    // Gets or sets the password for this URL.
    get password() { return this.#password_; }
    set password(value) { this.#password_ = value; }

    // Gets the host (hostname:port) for this URL.
    get host() { return this.#hostname_ + ':' + this.#port_; }

    // Gets or sets the hostname for this URL.
    get hostname() { return this.#hostname_; }
    set hostname(value) { this.#hostname_ = value; }

    // Gets or sets the port for this URL.
    get port() { return this.#port_; }
    set port(value) { this.#port_ = value; }

    // Gets or sets the pathname for this URL.
    get pathname() { return this.#pathname_; }
    set pathname(value) { this.#pathname_ = value; }

    // Gets or sets the search parameters for this URL.
    get search() { return this.#searchParams_.toString() || undefined; }
    set search(value) { this.#searchParams_ = new URLSearchParams(value); }
    
    // Gets the URLSearchParams value for this URL.
    get searchParams() { return this.#searchParams_; }

    // Gets or sets the hash value for this URL.
    get hash() { return this.#hash_; }
    set hash(value) { this.#hash_ = value; }

    // Converts this URL object to a string. Also accessible through the `href` getter.
    toString() {
        let output = `${this.#protocol_}://`;
        if (this.#username_) {
            output += this.#username_;
            if (this.#password_)
                output += `:${this.#password_}`;

            output += '@';
        }

        output += this.#hostname_;
        if (this.#port_ !== kDefaultPort.get(this.#protocol_))
            output += `:${this.#port_}`;
        
        if (this.#pathname_)
            output += this.#pathname_;
        else
            output += '/';
        
        const search = this.#searchParams_.toString();
        if (search.length)
            output += '?' + search;
        
        if (this.#hash_)
            output += '#' + this.#hash_;
        
        return output;
    }
}
