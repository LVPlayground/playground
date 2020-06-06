// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Body } from 'components/networking/body.js';
import { FormData } from 'components/networking/form_data.js';

import { stringToUtf8Buffer } from 'components/networking/utf-8.js';

describe('Body', it => {
    it('is able to represent Body data in various ways', async (assert) => {
        const emptyBody = new Body();

        assert.equal((await emptyBody.arrayBuffer()).byteLength, 0);
        assert.instanceOf(await emptyBody.formData(), FormData);
        assert.equal((await emptyBody.text()).length, 0);

        const jsonBody = new Body(stringToUtf8Buffer('[ "Hello!" ]'));

        assert.equal((await jsonBody.arrayBuffer()).byteLength, 12);
        assert.deepEqual(await jsonBody.json(), [ 'Hello!' ]);
        assert.equal((await jsonBody.text()).length, 12);
    });
});
