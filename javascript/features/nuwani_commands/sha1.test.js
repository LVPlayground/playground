// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { sha1 } from 'features/nuwani_commands/sha1.js';

describe('sha1', it => {
    it('produces the right hex values for reference values', assert => {
        assert.equal(sha1('lvp'), 'e5ff4f7521c05d1c01b5a02355c0a93199562850');
        assert.equal(sha1('Las Venturas Playground'), 'a24cfa4b03b3d9a6ff411e6faac8b9e9223b7008');
        assert.equal(sha1('@#$(*@$@kdsfd``1'), '37058711a3bd82c617a7a2684dd54f1fae1cdfa7');
    });
});
