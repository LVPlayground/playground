// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Response } from 'components/networking/response.js';

import { setResponseForTesting } from 'components/networking/fetch.js';
import { stringToUtf8Buffer } from 'components/networking/utf-8.js';

// Installs the mock authentication responses, making sure that we never hit the server while tests
// are running. Tests using this should make sure that they remove overrides in `afterEach`.
export function installMockAuthenticationResponses() {
    const kAuthenticationUrl = 'https://auth.sa-mp.nl/token';

    setResponseForTesting(kAuthenticationUrl, buildAuthenticationResponse(kAuthenticationUrl));
}

// Builds the response for a successful request to the Token service.
function buildAuthenticationResponse(url) {
    const body = stringToUtf8Buffer(JSON.stringify({
        access_token: 'mocked-token',
        expires_in: 3599,
        token_type: 'Bearer',
    }));

    return new Response(body, {
        url,
        redirected: false,
        status: 200,  // OK
        headers: null,
    });
}
