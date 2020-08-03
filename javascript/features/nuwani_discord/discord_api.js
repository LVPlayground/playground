// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { fetch } from 'components/networking/fetch.js';

// This class enables interaction with the Discord REST API. You generally don't want to use this
// directly, but rather use the DiscordMedium which is able to compose the calls for you.
export class DiscordAPI {
    #token_ = null;

    constructor(configuration) {
        this.#token_ = configuration?.token;
    }

    // Issues an API call to the given |url|, backed up by the given |data|. The |data| will be
    // serialized as JSON before issuing the request.
    async call(url, data) {
        if (!this.#token_)
            throw new Error(`Token information has not been initialized, the API is disabled.`);

        const response = await fetch(url, {
            method: 'POST',
            headers: [
                [ 'Authorization', 'Bot ' + this.#token_ ],
                [ 'Content-Type', 'application/json' ],
                [ 'User-Agent', 'lvpjs-nuwani (https://sa-mp.nl/, info@sa-mp.nl, v1.0)' ]
            ],
            body: JSON.stringify(data),
        });

        if (!response.ok)
            return false;

        return response.json();
    }
}
