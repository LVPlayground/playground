// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { URL } from 'components/networking/url.js';

describe('URL', it => {
    it('is able to fully parse both basic and complicated URLs', assert => {
        const basicUrl = new URL('https://sa-mp.nl/file.txt');

        assert.equal(basicUrl.href, 'https://sa-mp.nl/file.txt');
        assert.equal(basicUrl.origin, 'https://sa-mp.nl');
        assert.equal(basicUrl.protocol, 'https');
        assert.equal(basicUrl.username, undefined);
        assert.equal(basicUrl.password, undefined);
        assert.equal(basicUrl.host, 'sa-mp.nl:443');
        assert.equal(basicUrl.hostname, 'sa-mp.nl');
        assert.equal(basicUrl.port, 443);
        assert.equal(basicUrl.pathname, '/file.txt');
        assert.equal(basicUrl.search, undefined);
        assert.equal(basicUrl.hash, undefined);

        const complexUrl = new URL('https://russell:password@sa-mp.nl/api/?version=1&bar=2#help');

        assert.equal(
            complexUrl.href, 'https://russell:password@sa-mp.nl/api/?version=1&bar=2#help');

        assert.equal(complexUrl.origin, 'https://sa-mp.nl');
        assert.equal(complexUrl.protocol, 'https');
        assert.equal(complexUrl.username, 'russell');
        assert.equal(complexUrl.password, 'password');
        assert.equal(complexUrl.host, 'sa-mp.nl:443');
        assert.equal(complexUrl.hostname, 'sa-mp.nl');
        assert.equal(complexUrl.port, 443);
        assert.equal(complexUrl.pathname, '/api/');
        assert.equal(complexUrl.search, 'version=1&bar=2');
        assert.equal(complexUrl.hash, 'help');
    });

    it('is able to serialize even after changing information', assert => {
        const url = new URL('https://sa-mp.nl/foo');

        url.protocol = 'samp';
        url.username = 'russell';
        url.hostname = 'play.sa-mp.nl';
        url.port = 7777;
        url.pathname = '';
        url.searchParams.append('health', 100);
        url.hash = 'spawn';

        assert.equal(String(url), 'samp://russell@play.sa-mp.nl:7777/?health=100#spawn');
    });
});
