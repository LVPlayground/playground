// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Response } from 'components/networking/response.js';

describe('Response', it => {
    it('is able to deal with the static helpers', assert => {
        const errorResponse = Response.error();
        assert.equal(errorResponse.type, 'error');
        assert.isUndefined(errorResponse.url);
        assert.isFalse(errorResponse.redirected);
        assert.equal(errorResponse.status, 0);
        assert.equal(errorResponse.statusText, 'Unknown');
        assert.isFalse(errorResponse.ok);

        const redirectResponse = Response.redirect('https://sa-mp.nl/');
        assert.equal(redirectResponse.type, 'default');
        assert.isUndefined(redirectResponse.url);
        assert.isFalse(redirectResponse.redirected);
        assert.equal(redirectResponse.status, 302);
        assert.equal(redirectResponse.statusText, 'Moved Temporarily');
        assert.isFalse(redirectResponse.ok);

        assert.isTrue(redirectResponse.headers.has('Location'));
        assert.equal(redirectResponse.headers.get('Location'), 'https://sa-mp.nl/');
    });
});
