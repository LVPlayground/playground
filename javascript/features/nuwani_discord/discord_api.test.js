// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { DiscordAPI } from 'features/nuwani_discord/discord_api.js';
import { Response } from 'components/networking/response.js';

import { setResponseForTesting } from 'components/networking/fetch.js';
import { stringToUtf8Buffer } from 'components/networking/utf-8.js';

describe('DiscordAPI', it => {
    it('should be able to compose and issue REST API requests', async (assert) => {
        const api = new DiscordAPI({ token: 'abc123' });

        const errorUrl = 'https://fake.discord.com/api/call/error';
        const successfulUrl = 'https://fake.discord.com/api/call';
        const successfulBody = stringToUtf8Buffer(JSON.stringify({
            baz: 'qux'
        }));

        setResponseForTesting(errorUrl, Response.error());
        setResponseForTesting(successfulUrl, new Response(successfulBody, {
            url: successfulUrl,
            redirected: false,
            status: 200,  // OK
            headers: null,
        }));

        // (1) Make a failing URL call. This should simply return FALSE.
        const failedResult = await api.call('POST', errorUrl, {
            foo: 'bar',
        });

        assert.isFalse(failedResult);

        // (2) Make a successful API call. This is expected to return a JavaScript object.
        const successfulResult = await api.call('PUT', successfulUrl, {
            foo: 'bar',
        });

        assert.deepEqual(successfulResult, {
            baz: 'qux',
        });

        // Clean up the overridden configuration we've created.
        setResponseForTesting(null);
    });
});
