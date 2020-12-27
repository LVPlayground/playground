// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Response } from 'components/networking/response.js';

import { setResponseForTesting } from 'components/networking/fetch.js';
import { stringToUtf8Buffer } from 'components/networking/utf-8.js';

// The base URL against which all sessions will be installed.
const kBaseUrl =
    'https://dialogflow.googleapis.com/v2beta1/projects/lvp-testing-project/agent/sessions';

// Installs the mock Dialogflow responses, making sure that we never hit the server while tests
// are running. Tests using this should make sure that they remove overrides in `afterEach`.
export function installMockDialogflowResponses() {
    installForSessionId(/* Russell= */ 92345, new Map([
        [
            'how are you doing?',
            {
                action: 'input.unknown',
                text: `I'm doing great, thanks!`,
            }
        ]
    ]));
}

// Installs the given |responses| for the given |sessionId|. This will be handled by a function to
// be able to dynamically generate the right responses, errors and whatever else.
function installForSessionId(sessionId, responses) {
    setResponseForTesting(`${kBaseUrl}/${sessionId}:detectIntent`, async (request, url) => {
        const requestBody = await request.json();
        const query = requestBody.queryInput.text.text;

        if (!responses.has(query))
            return Response.error();

        const { action, text } = responses.get(query);

        // Build the Body that will be returned by the Response.
        const body = stringToUtf8Buffer(JSON.stringify({
            responseId: 'some-id',
            queryResult: {
                queryText: query,
                action,
                fulfillmentText: text,
            }
        }));
    
        // Build the actual Response, and return it immediately.
        return new Response(body, {
            url,
            redirected: false,
            status: 200,  // OK
            headers: null,
        });
    });
}
