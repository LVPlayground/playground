// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AuthenticationInfo } from 'features/gunther/api/authentication/authentication_info.js';
import { JsonWebToken } from 'features/gunther/api/authentication/json_web_token.js';

describe('JsonWebToken', it => {
    it('should be able to sign JWT tokens based on authentication data', assert => {
        const authentication = AuthenticationInfo.loadForTesting();
        const jwt = new JsonWebToken();

        jwt.set('iss', authentication.clientEmail);
        jwt.set('scope', 'https://auth.sa-mp.nl/scope/players')
        jwt.set('aud', authentication.tokenUrl);

        const token = jwt.create(authentication);

        assert.equal(
            token,
            'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InByaXZhdGUta2V5LWZvci10ZXN0aW5nIn0.eyJp' +
            'c3MiOiJpbmZvK3Rlc3RAc2EtbXAubmwiLCJzY29wZSI6Imh0dHBzOi8vYXV0aC5zYS1tcC5ubC9zY29wZS9w' +
            'bGF5ZXJzIiwiYXVkIjoiaHR0cHM6Ly9hdXRoLnNhLW1wLm5sL3Rva2VuIn0.BaZFny4SgK-4sZ4ugITHNzYN' +
            '9zdp47npXcNTOLej1F49WpFoT_ahL5L79B-ICj4YilV9t9wUVxg3MEwJwGxuWA');
    });

    it('is able to base64url encode plaintext', assert => {
        const jwt = new JsonWebToken();
        const input = 'hello?world';

        assert.equal(btoa(input), 'aGVsbG8/d29ybGQ=');
        assert.equal(jwt.base64UrlEncode(input), 'aGVsbG8_d29ybGQ');

        assert.equal(btoa(''), jwt.base64UrlEncode(''));
    });
});
