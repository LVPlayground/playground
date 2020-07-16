// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { JsonWebToken } from 'features/gunther/api/authentication/json_web_token.js';

describe('JsonWebToken', it => {
    it('is able to base64url encode plaintext', assert => {
        const jwt = new JsonWebToken();
        const input = 'hello?world';

        assert.equal(btoa(input), 'aGVsbG8/d29ybGQ=');
        assert.equal(jwt.base64UrlEncode(input), 'aGVsbG8_d29ybGQ');

        assert.equal(btoa(''), jwt.base64UrlEncode(''));
    });
});
