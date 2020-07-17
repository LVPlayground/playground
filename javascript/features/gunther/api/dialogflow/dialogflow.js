// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { QueryParameters } from 'features/gunther/api/dialogflow/query_parameters.js';

// Enables high level interaction with the Dialogflow API. It builds on the Authenticator which
// manages authentication and token management for us, through Google's Oauth2 interfaces.
export class Dialogflow {
    #authenticator_ = null;

    constructor(authenticator) {
        this.#authenticator_ = authenticator;
    }

    // Issues a DetectIntent API call for the given |sessionId|, which maps to a conversation, the
    // given two-character |languageCode| and the |text|, which is the input query. Optionally the
    // |params| may be given as well, which must be an instance of the QueryParameters class.
    async detectIntent({ sessionId = null, languageCode = null, text = null, params = null } = {}) {
        if (typeof sessionId !== 'number')
            throw new Error(`The given session Id ("${sessionId}") must be a number.`);

        if (typeof languageCode !== 'string' || languageCode.length != 2)
            throw new Error(`The given language code ("${languageCode}") must be a 2-char string.`);

        if (typeof text !== 'string' || !text.length)
            throw new Error(`The given text ("${text}") must be a non-empty string.`);

        if (params && !(params instanceof QueryParameters))
            throw new Error(`The given parameters must be an QueryParameters instance.`);

        // (1) If the Authenticator is not available, bail out right now.
        if (!this.#authenticator_.isAvailable())
            return null;

        // (2) Always include the |text| and the |languageCode| in the request.
        const request = {
            queryInput: {
                text: { text, languageCode }
            }
        };

        // (3) If the |params| have been given, and has been modified, include those in the request.
        if (params) {
            const paramObject = params.buildObject();
            if (paramObject !== null)
                request.queryParams = paramObject;
        }

        // (4) Build the URL to which the request has to be issued.
        const baseUrl = 'https://dialogflow.googleapis.com/v2beta1';
        const projectId = this.#authenticator_.projectId;

        // (5) Issue the request with the Authenticator, and return the result.
        return await this.#authenticator_.authenticatedRequest({
            url: `${baseUrl}/projects/${projectId}/agent/sessions/${sessionId}:detectIntent`,
            body: request,
        });
    }

    dispose() {
        this.#authenticator_ = null;
    }
}
