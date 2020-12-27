// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AuthenticationInfo } from 'features/gunther/api/authentication/authentication_info.js';
import { Response } from 'components/networking/response.js';
import { TokenRequest } from 'features/gunther/api/authentication/token_request.js';

import { setResponseForTesting } from 'components/networking/fetch.js';
import { stringToUtf8Buffer } from 'components/networking/utf-8.js';

describe('TokenRequest', (it, beforeEach, afterEach) => {
    afterEach(() => setResponseForTesting(null));

    const kPermissions = [ 'https://www.googleapis.com/auth/dialogflow' ];

    it('should be able to deal with networking errors', async (assert) => {
        const authentication = AuthenticationInfo.loadForTesting();

        // This mocks a failing response for the token URL.
        setResponseForTesting(authentication.tokenUrl, Response.error());

        // Issue the TokenRequest, for which we expect the result to be NULL.
        const request = new TokenRequest(authentication);
        assert.isNull(await request.issue(kPermissions));
    });

    it('should be able to deal with successful requests', async (assert) => {
        const authentication = AuthenticationInfo.loadForTesting();

        // This mocks a successful response carrying a token from the token URL.
        const body = stringToUtf8Buffer(JSON.stringify({
            access_token: 'this-is-a-token',
            expires_in: 3599,
            token_type: 'Bearer',
        }));

        setResponseForTesting(authentication.tokenUrl, new Response(body, {
            url: authentication.tokenUrl,
            redirected: false,
            status: 200,  // OK
            headers: null,
        }));

        // Issue the TokenRequest, for which we expect the result to be successful with the given
        // token and expiration time, normalized to our monotonically increasing time.
        const request = new TokenRequest(authentication);
        const response = await request.issue(kPermissions);

        assert.isTrue(response.success);
        assert.equal(response.token, 'this-is-a-token');
        assert.closeTo(
            response.expiration, server.clock.monotonicallyIncreasingTime() + 3599 * 1000, 60);
    });

    it('should be able to deal with failing requests', async (assert) => {
        const authentication = AuthenticationInfo.loadForTesting();

        // This mocks a successful response carrying a response error in from the token URL.
        const body = stringToUtf8Buffer(JSON.stringify({
            error: 'invalid_grant',
            error_description: 'Invalid JWT: Something is wrong with the JWT!'
        }));

        setResponseForTesting(authentication.tokenUrl, new Response(body, {
            url: authentication.tokenUrl,
            redirected: false,
            status: 400,  // Bad Request
            headers: null,
        }));

        // Issue the TokenRequest, for which we expect an error response. Nothing will be logged to
        // the console because we're running tests - in production that would be the case.
        const request = new TokenRequest(authentication);
        const response = await request.issue(kPermissions);

        assert.isFalse(response.success);
    });
});
