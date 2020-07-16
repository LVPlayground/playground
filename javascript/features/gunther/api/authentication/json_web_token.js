// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { clone } from 'base/clone.js';

// Encapsulates a JSON Web Token (JWT), as defined in RFC 7797: https://tools.ietf.org/html/rfc7519
export class JsonWebToken {
    #header_ = null;
    #payload_ = null;

    constructor() {
        this.#header_ = {
            alg: 'RS256',
            typ: 'JWT',
        };

        this.#payload_ = {};
    }

    // Sets a field with the given |name| on the JWT to the given |value|.
    set(name, value) { this.#payload_[name] = value; }

    // Creates and signs the full token based on the given |authenticationInfo|. The signature will
    // be calculated based on the private key included therein.
    create(authenticationInfo) {
        const header = clone(this.#header_);
        const payload = clone(this.#payload_);

        // Append the "kid" field to the JWT's header when set in the authentication info.
        if (typeof authenticationInfo.privateKeyId === 'string')
            header.kid = authenticationInfo.privateKeyId;

        // Compose the message from the serialized header and payload, then calculate the signature.
        const message = this.base64UrlEncode(JSON.stringify(header)) + '.' +
                        this.base64UrlEncode(JSON.stringify(payload));

        const signature = signMessage(authenticationInfo.privateKey, message);

        // Put them together, and we've got a full JWT going for us.
        return message + '.' + this.convertToBase64Url(signature);
    }

    // Encodes the given |plaintext| as base64url, which is a regular base64 encoding with the
    // padding removed, and certain characters substituted with others to make it URL-safe.
    base64UrlEncode(plaintext) {
        return this.convertToBase64Url(btoa(plaintext));
    }

    // Converts the given |base64| to base64url by substituting the necessary characters and then
    // removing the trailing padding.
    convertToBase64Url(base64) {
        return base64.replace(/\+/g, '-').replace(/\//g, '_')
                     .replace(/=*$/, '');
    }
}
