// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AuthenticationInfo } from 'features/gunther/api/authentication/authentication_info.js';
import { URL } from 'components/networking/url.js';

describe('AuthenticationInfo', it => {
    it('should be able to fully load the configuration file, when it exists', assert => {
        // Verify that the testing data for authentication can be used to sign messages.
        const authenticationForTesting = AuthenticationInfo.loadForTesting();

        assert.doesNotThrow(() => signMessage(authenticationForTesting.privateKey, 'Hello, world'));

        // Proceed with the production tests if Gunther's authentication data has been set.
        const authentication = AuthenticationInfo.loadFromDisk();
        if (!authentication)
            return null;  // the file does not exist

        assert.typeOf(authentication.authenticationUrl, 'string');
        assert.typeOf(authentication.clientEmail, 'string');
        assert.typeOf(authentication.clientId, 'number');
        assert.typeOf(authentication.privateKey, 'string');
        assert.typeOf(authentication.privateKeyId, 'string');
        assert.typeOf(authentication.projectId, 'string');
        assert.typeOf(authentication.tokenUrl, 'string');

        // Expect HTTPS endpoints to be used for the authentication.
        assert.equal(new URL(authentication.authenticationUrl).protocol, 'https');
        assert.equal(new URL(authentication.tokenUrl).protocol, 'https');

        // Sign a moot message with the private key, to confirm that it can be loaded.
        assert.doesNotThrow(() => signMessage(authentication.privateKey, 'Hello, world'));
    });
});
