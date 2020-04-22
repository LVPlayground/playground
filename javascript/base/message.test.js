// Copyright 2015 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Message from 'base/message.js';

describe('Message', it => {
  it('should filter colours from messages', assert => {
    assert.equal(Message.filter('{FFFFFF}color'), 'color');
    assert.equal(Message.filter('{FFFFFF}color{FFFFFF}'), 'color');
    assert.equal(Message.filter('color{FFFFFF}'), 'color');

    assert.equal(Message.filter('{FFFFFFF}color'), 'color');
    assert.equal(Message.filter('{FFFFFFFF}color'), 'color');

    assert.equal(Message.filter('{12345}color'), '{12345}color');
    assert.equal(Message.filter('{123456789}color'), '{123456789}color');

    assert.equal(Message.filter('{123456}color'), 'color');
    assert.equal(Message.filter('{abc123}color'), 'color');
  });
});
