// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AuthenticationInfo } from 'features/gunther/api/authentication/authentication_info.js';
import { Headers } from 'components/networking/headers.js';
import { TokenRequest } from 'features/gunther/api/authentication/token_request.js';

import { fetch } from 'components/networking/fetch.js';

// The authenticator is able to request the necessary access tokens to be able to talk with Oauth2
// based APIs that provide the backend for Gunther.
export class Authenticator {
    #authentication_ = null;
    #permissions_ = null;

    // The bearer token, and when it expires. It will always be fetched the first time there's a
    // need for the token, by the authenticatedRequest() method.
    #token_ = null;
    #tokenExpiration_ = null;
    #disabled_ = false;

    constructor(permissions) {
        this.#permissions_ = permissions;
        this.#authentication_ = server.isTest() ? AuthenticationInfo.loadForTesting()
                                                : AuthenticationInfo.loadFromDisk();
    }

    // Gets the Project ID for which this authenticator has been created.
    get projectId() { return this.#authentication_.projectId; }

    // Returns whether the Authenticator is available, and requests can be made.
    isAvailable() { return this.#authentication_ !== null && !this.#disabled_; }

    // Makes an authenticated request against the given |url| as the API endpoint. The URL must be
    // given as a string, the |headers| are optional and, when given, should be an instance of the
    // Headers class, and the |body| should be given as an object that can be serialized.
    async authenticatedRequest({ url = null, method = 'POST', headers = null, body = null } = {}) {
        if (!(this.#authentication_ instanceof AuthenticationInfo))
            throw new Error('Illegal to issue requests when the authenticator is not available.');

        if (headers && !(headers instanceof Headers))
            throw new Errror('When given, the |headers| must be an instance of Headers.');

        // (1) If the system self-disabled, break off the request.
        if (this.#disabled_)
            return null;

        // (2) Ensure that we've got a recent and valid Bearer token for the request.
        if (!this.#token_ || this.#tokenExpiration_ <= server.clock.monotonicallyIncreasingTime()) {
            const tokenRequest = new TokenRequest(this.#authentication_);
            const tokenResponse = await tokenRequest.issue(this.#permissions_);

            // If the |tokenRequest| could not be issued, disable the Authenticator. An improvement
            // on the current system would be to enable retry after a certain period of time.
            if (tokenResponse === null || !tokenResponse.success) {
                this.#disabled_ = true;
                return null;
            }

            this.#token_ = tokenResponse.token;
            this.#tokenExpiration_ = tokenResponse.expiration;
        }

        // (3) Now that we've got a valid token, ensure that it's included in the |headers|.
        headers = headers ?? new Headers();
        headers.set('Authorization', 'Bearer ' + this.#token_);

        // (4) Issue the actual request to the network. Only OK responses will be forwarded to the
        // caller, other responses will be handled internally.
        const response = await fetch(url, {
            body: JSON.stringify(body),
            method, headers,
        });

        // (a) Network failures will result in NULL, nothing we can do.
        if (response.type === 'error')
            return null;
        
        // (b) Not-OK responses will be outputted to the console.
        if (!response.ok) {
            console.log(`[Authenticator] Error: ${await response.text()}`);
            return null;
        }

        // (c) All other requests will result in the response JSON being returned.
        return await response.json();
    }
}
