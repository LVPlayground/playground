// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Support for base64 has been provided by the PlaygroundJS plugin, as this comes for free with
// OpenSSL which we already depend on. Use the atob() and btoa() functions, globally available,
// which work in an identical way on the Web Platform:
//
// https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/atob (decode)
// https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/btoa (encode)
//
// Yes, these names are awful, but you're likely to see them again when creating a website.

describe('base64', it => {
    it('should be able to encode and decode base64 content', assert => {
        assert.equal(atob(btoa('Hello, world!')), 'Hello, world!');
        assert.equal(atob(btoa('Las Venturas Playground')), 'Las Venturas Playground');

        // Reference tests for encoding content (https://tools.ietf.org/html/rfc4648)
        assert.equal(btoa(''), '');
        assert.equal(btoa('f'), 'Zg==');
        assert.equal(btoa('fo'), 'Zm8=');
        assert.equal(btoa('foo'), 'Zm9v');
        assert.equal(btoa('foob'), 'Zm9vYg==');
        assert.equal(btoa('fooba'), 'Zm9vYmE=');
        assert.equal(btoa('foobar'), 'Zm9vYmFy');

        // Reference tests for decoding content (https://tools.ietf.org/html/rfc4648)
        assert.equal(atob(''), '');
        assert.equal(atob('Zg=='), 'f');
        assert.equal(atob('Zm8='), 'fo');
        assert.equal(atob('Zm9v'), 'foo');
        assert.equal(atob('Zm9vYg=='), 'foob');
        assert.equal(atob('Zm9vYmE='), 'fooba');
        assert.equal(atob('Zm9vYmFy'), 'foobar');
    });
});
