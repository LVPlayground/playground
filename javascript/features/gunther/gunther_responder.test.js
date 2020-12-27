// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { installMockAuthenticationResponses } from 'features/gunther/api/test/mock_authentication_responses.js';
import { installMockDialogflowResponses } from 'features/gunther/api/test/mock_dialogflow_responses.js';
import { setResponseForTesting } from 'components/networking/fetch.js';

describe('GuntherResponder', (it, beforeEach, afterEach) => {
    let feature = null;
    let responder = null;
    let russell = null;

    beforeEach(async () => {
        feature = server.featureManager.loadFeature('gunther');
        responder = feature.responder_;
        russell = server.playerManager.getById(/* Russell= */ 1);

        await russell.identify({ userId: 92345 });  // has mocked responses

        await installMockAuthenticationResponses();
        await installMockDialogflowResponses();
    });

    afterEach(() => setResponseForTesting(null));

    it('should be able to respond to basic questions', async (assert) => {
        assert.equal(russell.messages.length, 0);

        await russell.issueMessage('Gunther, how are you doing?');

        assert.isTrue(await feature.responsePromiseForTesting_);

        assert.equal(russell.messages.length, 2);
        assert.includes(russell.messages[1], 'Gunther');
        assert.includes(russell.messages[1], `I'm doing great, thanks!`);
    });
});
