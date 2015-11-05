// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

let Message = require('base/message.js');

describe('Message', it => {
  it('should format times', assert => {
    assert.equal(Message.formatTime(false), false);
    assert.equal(Message.formatTime('tomorrow'), 'tomorrow');
    assert.deepEqual(Message.formatTime({}), {});

    assert.equal(Message.formatTime(0), '00:00');
    assert.equal(Message.formatTime(42), '00:42');
    assert.equal(Message.formatTime(121), '02:01');
    assert.equal(Message.formatTime(1835), '30:35');

    assert.equal(Message.formatTime(3600), '01:00:00');
    assert.equal(Message.formatTime(3661), '01:01:01');
    assert.equal(Message.formatTime(7200), '02:00:00');
    assert.equal(Message.formatTime(36154), '10:02:34');
  });
});
