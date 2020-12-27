// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Headers } from 'components/networking/headers.js';
import { JsonWebToken } from 'features/gunther/api/authentication/json_web_token.js';
import { URLSearchParams } from 'components/networking/url_search_params.js';

import { fetch } from 'components/networking/fetch.js';

// Reqeusts an access token from the OAuth2 provider for the service account that will be used to
// drive Gunther's intelligence. This is documented on the following page:
// https://developers.google.com/identity/protocols/oauth2/service-account#httprest
export class TokenRequest {
    #authenticationInfo_ = null;

    constructor(authenticationInfo) {
        this.#authenticationInfo_ = authenticationInfo;
    }

    // Issues the token request based on the available information, and the |permissions| which must
    // be an array with the requested permissions. Will return when the request has completed.
    async issue(permissions) {
        const jwt = new JsonWebToken();
        const iat = Math.floor(Date.now() / 1000) - 120;

        // (1) Compose the payload of the JSON Web Token that'll make the request.
        jwt.set('iss', this.#authenticationInfo_.clientEmail);
        jwt.set('scope', permissions.join(' '));
        jwt.set('aud', this.#authenticationInfo_.tokenUrl);
        jwt.set('exp', iat + 1800 /* 30 minutes */);
        jwt.set('iat', iat);

        // (2) Compose the headers and body for the network request that will be issued.
        const body = new URLSearchParams();
        const headers = new Headers();
        
        body.set('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
        body.set('assertion', jwt.create(this.#authenticationInfo_));

        headers.set('Content-Type', 'application/x-www-form-urlencoded');

        // (3) Issue the actual network fetch. This should give us a JSON-based response with the
        // Bearer token & a validity time when successful.
        const response = await fetch(this.#authenticationInfo_.tokenUrl, {
            method: 'POST',
            headers, body,
        });

        // (a) If the response failed, bail out and return NULL. The system cannot be operational.
        if (response.type === 'error')
            return null;

        // (b) Otherwise we've got a response! This could either be successful or unsuccessful,
        // which we'll determine through the JSON data that has been returned.
        const data = await response.json();

        if (data.hasOwnProperty('access_token') && data.hasOwnProperty('expires_in')) {
            return {
                success: true,
                token: data.access_token,
                expiration: server.clock.monotonicallyIncreasingTime() + data.expires_in * 1000,
            };
        } else if (!server.isTest()) {
            console.log(`[TokenRequest] Error: ${await response.text()}`);
        }

        return { success: false };
    }
}
